import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import { fetchInsecure, parseApiError } from '@/lib/fetch-ssl';

export interface DashdotData {
  cpu: {
    brand: string;
    model: string;
    cores: number;
    threads: number;
    frequency: number;
  };
  ram: {
    total: number;
    used: number;
  };
  storage: {
    total: number;
    used: number;
  };
  network: {
    speedUp: number;
    speedDown: number;
  };
  gpu?: {
    brand: string;
    model: string;
  };
  os: {
    platform: string;
    distro: string;
    release: string;
    uptime: number;
  };
  temps: {
    cpu: number;
    gpu?: number;
  };
  // Historical data for graphs
  cpuHistory: number[];
  ramHistory: number[];
  tempHistory: number[];
}

interface DashdotApiInfo {
  cpu?: {
    brand?: string;
    model?: string;
    cores?: number;
    threads?: number;
    frequency?: number;
  };
  ram?: {
    size?: number;
  };
  storage?: Array<{
    size?: number;
  }>;
  os?: {
    platform?: string;
    distro?: string;
    release?: string;
    uptime?: number;
  };
  gpu?: {
    brand?: string;
    model?: string;
  };
}

interface DashdotApiLoad {
  cpu?: Array<{ load?: number }>;
  ram?: { load?: number };
  temps?: Array<{ main?: number }>;
}

async function fetchDashdotData(): Promise<DashdotData> {
  const host = process.env.DASHDOT_HOST;

  if (!host) {
    throw new Error('Dashdot configuration missing');
  }

  // Fetch system info
  const infoRes = await fetchInsecure(`${host}/api/info`, {
    timeout: 10000,
  });

  if (!infoRes.ok) {
    throw new Error(`Dashdot API error: ${infoRes.status}`);
  }

  const info: DashdotApiInfo = await infoRes.json();

  // Fetch current load/stats
  const loadRes = await fetchInsecure(`${host}/api/load`, {
    timeout: 10000,
  });

  let load: DashdotApiLoad = {};
  if (loadRes.ok) {
    load = await loadRes.json();
  }

  // Calculate CPU average load
  const cpuLoads = load.cpu || [];
  const avgCpuLoad = cpuLoads.length > 0
    ? cpuLoads.reduce((sum, c) => sum + (c.load || 0), 0) / cpuLoads.length
    : 0;

  // Get RAM usage
  const ramLoad = load.ram?.load || 0;
  const ramTotal = (info.ram?.size || 0) * 1024 * 1024 * 1024; // GB to bytes
  const ramUsed = ramTotal * (ramLoad / 100);

  // Get temperature
  const temps = load.temps || [];
  const cpuTemp = temps.length > 0 ? (temps[0].main || 0) : 0;

  // Calculate total storage
  const storageDevices = info.storage || [];
  const totalStorage = storageDevices.reduce((sum, s) => sum + (s.size || 0), 0) * 1024 * 1024 * 1024;

  return {
    cpu: {
      brand: info.cpu?.brand || 'Unknown',
      model: info.cpu?.model || 'Unknown',
      cores: info.cpu?.cores || 0,
      threads: info.cpu?.threads || 0,
      frequency: info.cpu?.frequency || 0,
    },
    ram: {
      total: ramTotal,
      used: ramUsed,
    },
    storage: {
      total: totalStorage,
      used: 0, // Would need additional API call
    },
    network: {
      speedUp: 0,
      speedDown: 0,
    },
    gpu: info.gpu ? {
      brand: info.gpu.brand || 'Unknown',
      model: info.gpu.model || 'Unknown',
    } : undefined,
    os: {
      platform: info.os?.platform || 'Unknown',
      distro: info.os?.distro || 'Unknown',
      release: info.os?.release || 'Unknown',
      uptime: info.os?.uptime || 0,
    },
    temps: {
      cpu: cpuTemp,
    },
    cpuHistory: [avgCpuLoad], // Single point, will accumulate on client
    ramHistory: [ramLoad],
    tempHistory: [cpuTemp],
  };
}

export async function GET(): Promise<NextResponse<ApiResponse<DashdotData>>> {
  try {
    const data = await fetchDashdotData();

    return NextResponse.json({
      success: true,
      data,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Dashdot API Error:', error);

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
