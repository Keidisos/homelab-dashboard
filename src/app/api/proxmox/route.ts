import { NextResponse } from 'next/server';
import type { ProxmoxNode, ProxmoxVM, ApiResponse, ProxmoxData } from '@/types';
import { fetchInsecure, parseApiError } from '@/lib/fetch-ssl';
import { recordMetric } from '@/lib/metrics-db';

async function proxmoxFetch<T>(endpoint: string): Promise<T> {
  const host = process.env.PROXMOX_HOST;
  const tokenId = process.env.PROXMOX_TOKEN_ID;
  const tokenSecret = process.env.PROXMOX_TOKEN_SECRET;

  if (!host || !tokenId || !tokenSecret) {
    throw new Error('Proxmox configuration missing');
  }

  const url = `${host}/api2/json${endpoint}`;

  const response = await fetchInsecure(url, {
    headers: {
      Authorization: `PVEAPIToken=${tokenId}=${tokenSecret}`,
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'No response body');
    console.error(`Proxmox API failed: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`Proxmox API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json() as { data: T };
  return json.data;
}

interface RawNode {
  node: string;
  status: string;
  cpu: number;
  maxcpu: number;
  mem: number;
  maxmem: number;
  uptime: number;
}

async function getNodeTemperature(nodeName: string): Promise<number | undefined> {
  // Approach 1: Try new sensors API (PVE 8.3+)
  try {
    const sensors = await proxmoxFetch<Record<string, unknown>[]>(
      `/nodes/${nodeName}/hardware/sensors/temperature/cpu`
    );
    if (Array.isArray(sensors) && sensors.length > 0) {
      for (const sensor of sensors) {
        const t = sensor.temp ?? sensor.temperature ?? sensor.input;
        if (typeof t === 'number') return t;
      }
    }
  } catch {
    // Endpoint not available
  }

  // Approach 2: Check detailed node status for thermal data
  try {
    const status = await proxmoxFetch<Record<string, unknown>>(`/nodes/${nodeName}/status`);

    // Check top-level keys for temperature-related data
    for (const [key, value] of Object.entries(status)) {
      if ((key.includes('temp') || key.includes('thermal') || key.includes('sensor')) && typeof value === 'number') {
        return value;
      }
    }

    // Check cpuinfo sub-object
    const cpuinfo = status.cpuinfo as Record<string, unknown> | undefined;
    if (cpuinfo) {
      for (const [key, value] of Object.entries(cpuinfo)) {
        if (key.includes('temp') && typeof value === 'number') return value;
      }
    }
  } catch {
    // Failed
  }

  // Approach 3: Try rrddata for temperature fields
  try {
    const rrdData = await proxmoxFetch<Record<string, unknown>[]>(
      `/nodes/${nodeName}/rrddata?timeframe=hour&cf=AVERAGE`
    );
    if (Array.isArray(rrdData) && rrdData.length > 0) {
      // Get most recent data point
      const latest = rrdData[rrdData.length - 1];
      for (const [key, value] of Object.entries(latest)) {
        if (key.includes('temp') && typeof value === 'number') return value;
      }
    }
  } catch {
    // No temperature data available
  }

  return undefined;
}

async function getNodes(): Promise<{ nodes: ProxmoxNode[]; nodeNames: string[] }> {
  const rawNodes = await proxmoxFetch<RawNode[]>('/nodes');

  const nodesWithTemp = await Promise.all(
    rawNodes.map(async (node) => {
      const temperature = node.status === 'online'
        ? await getNodeTemperature(node.node)
        : undefined;

      return {
        node: node.node,
        status: node.status === 'online' ? 'online' as const : 'offline' as const,
        cpu: node.cpu,
        maxcpu: node.maxcpu,
        mem: node.mem,
        maxmem: node.maxmem,
        uptime: node.uptime,
        temperature,
      };
    })
  );

  const nodeNames = rawNodes.map((n) => n.node);

  return { nodes: nodesWithTemp, nodeNames };
}

async function getVMsForNode(nodeName: string): Promise<ProxmoxVM[]> {
  interface RawVM {
    vmid: number;
    name: string;
    status: string;
    cpu?: number;
    maxcpu?: number;
    mem?: number;
    maxmem?: number;
    uptime?: number;
    netin?: number;
    netout?: number;
  }

  // Récupérer VMs QEMU et containers LXC
  const [qemuVMs, lxcContainers] = await Promise.all([
    proxmoxFetch<RawVM[]>(`/nodes/${nodeName}/qemu`).catch(() => [] as RawVM[]),
    proxmoxFetch<RawVM[]>(`/nodes/${nodeName}/lxc`).catch(() => [] as RawVM[]),
  ]);

  const mapVM = (vm: RawVM, type: 'qemu' | 'lxc'): ProxmoxVM => ({
    vmid: vm.vmid,
    name: vm.name,
    status: vm.status as 'running' | 'stopped' | 'paused',
    type,
    cpu: vm.cpu || 0,
    maxcpu: vm.maxcpu || 1,
    mem: vm.mem || 0,
    maxmem: vm.maxmem || 0,
    uptime: vm.uptime,
    netin: vm.netin,
    netout: vm.netout,
  });

  return [
    ...qemuVMs.map((vm) => mapVM(vm, 'qemu')),
    ...lxcContainers.map((vm) => mapVM(vm, 'lxc')),
  ];
}

async function getAllVMs(nodeNames: string[]): Promise<ProxmoxVM[]> {
  // Get VMs from all nodes
  const vmArrays = await Promise.all(
    nodeNames.map((nodeName) => getVMsForNode(nodeName))
  );

  // Flatten the array
  return vmArrays.flat();
}

export async function GET(): Promise<NextResponse<ApiResponse<ProxmoxData>>> {
  try {
    // Vérifier les variables d'environnement
    if (!process.env.PROXMOX_HOST || !process.env.PROXMOX_TOKEN_ID || !process.env.PROXMOX_TOKEN_SECRET) {
      throw new Error('Proxmox configuration missing. Check environment variables.');
    }

    // First get nodes to discover actual node names
    const { nodes, nodeNames } = await getNodes();

    if (nodeNames.length === 0) {
      throw new Error('No Proxmox nodes found');
    }

    // Get VMs from all discovered nodes
    const vms = await getAllVMs(nodeNames);

    // Record metrics for persistent history
    for (const node of nodes) {
      if (node.status === 'online') {
        const cpuPercent = node.cpu * 100;
        const ramPercent = (node.mem / node.maxmem) * 100;
        recordMetric(node.node, cpuPercent, ramPercent);
      }
    }

    return NextResponse.json({
      success: true,
      data: { nodes, vms },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Proxmox API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: parseApiError(error),
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
