'use client';

import { Server, Cpu, MemoryStick, Box } from 'lucide-react';
import { ServiceCard, ServiceCardSkeleton } from '@/components/dashboard/service-card';
import { useProxmox } from '@/hooks/use-services';
import type { ProxmoxVM, ServiceStatus, ServiceMetric } from '@/types';

function formatBytes(bytes: number): { value: number; unit: string } {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return { value: parseFloat(gb.toFixed(1)), unit: 'GB' };
  }
  const mb = bytes / (1024 * 1024);
  return { value: parseFloat(mb.toFixed(0)), unit: 'MB' };
}

function getVMStatus(status: string): ServiceStatus {
  switch (status) {
    case 'running':
      return 'online';
    case 'stopped':
      return 'offline';
    case 'paused':
      return 'warning';
    default:
      return 'unknown';
  }
}

export function ProxmoxSection() {
  const { data, isLoading, error } = useProxmox();

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Server className="h-4 w-4 text-orange-400" />
          Proxmox VE
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (error || !data?.success || !data.data) {
    return (
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Server className="h-4 w-4 text-orange-400" />
          Proxmox VE
        </h3>
        <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4 text-red-400 text-sm">
          Failed to connect to Proxmox: {error?.message || data?.error || 'Unknown error'}
        </div>
      </section>
    );
  }

  const { nodes, vms } = data.data;

  // Node card
  const nodeCards = nodes.map((node) => {
    const cpuPercent = (node.cpu * 100);
    const memUsed = formatBytes(node.mem);
    const memMax = formatBytes(node.maxmem);

    const metrics: ServiceMetric[] = [
      {
        label: 'CPU',
        value: cpuPercent,
        max: 100,
        unit: '%',
      },
      {
        label: 'Memory',
        value: memUsed.value,
        max: memMax.value,
        unit: memMax.unit,
      },
    ];

    return (
      <ServiceCard
        key={`node-${node.node}`}
        name={node.node}
        description="Proxmox Node"
        status={node.status}
        icon={Server}
        metrics={metrics}
        externalUrl={process.env.NEXT_PUBLIC_PROXMOX_HOST}
      />
    );
  });

  // VM cards
  const vmCards = vms.map((vm: ProxmoxVM) => {
    const memUsed = formatBytes(vm.mem);
    const memMax = formatBytes(vm.maxmem);

    const metrics: ServiceMetric[] = [];

    if (vm.status === 'running') {
      metrics.push({
        label: 'CPU',
        value: vm.cpu * 100,
        max: 100,
        unit: '%',
      });
      metrics.push({
        label: 'Memory',
        value: memUsed.value,
        max: memMax.value,
        unit: memMax.unit,
      });
    }

    return (
      <ServiceCard
        key={`vm-${vm.vmid}`}
        name={vm.name}
        description={vm.type === 'lxc' ? 'LXC Container' : 'Virtual Machine'}
        status={getVMStatus(vm.status)}
        icon={vm.type === 'lxc' ? Box : Cpu}
        metrics={metrics}
      />
    );
  });

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <Server className="h-4 w-4 text-orange-400" />
        Proxmox VE
        <span className="text-xs text-slate-600">
          ({nodes.length} node{nodes.length > 1 ? 's' : ''}, {vms.length} VM/CT)
        </span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {nodeCards}
        {vmCards}
      </div>
    </section>
  );
}
