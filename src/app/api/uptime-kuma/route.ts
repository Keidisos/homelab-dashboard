import { NextResponse } from 'next/server';
import type { ApiResponse, UptimeKumaData, UptimeKumaMonitor } from '@/types';
import { fetchInsecure, parseApiError } from '@/lib/fetch-ssl';

interface StatusPageHeartbeat {
  status: number;
  time: string;
  msg: string;
  ping: number;
}

interface StatusPageMonitor {
  id: number;
  name: string;
  sendUrl?: number;
  type?: string;
}

interface StatusPageConfig {
  id: number;
  slug: string;
  title: string;
  published: boolean;
}

interface StatusPageResponse {
  ok?: boolean;
  config?: StatusPageConfig;
  publicGroupList?: Array<{
    id: number;
    name: string;
    monitorList: StatusPageMonitor[];
  }>;
  heartbeatList?: Record<string, StatusPageHeartbeat[]>;
  uptimeList?: Record<string, number>;
}

function mapStatus(statusCode: number): UptimeKumaMonitor['status'] {
  switch (statusCode) {
    case 1:
      return 'up';
    case 0:
      return 'down';
    case 2:
      return 'pending';
    case 3:
      return 'maintenance';
    default:
      return 'pending';
  }
}

async function fetchUptimeKuma(): Promise<UptimeKumaData> {
  const host = process.env.UPTIME_KUMA_HOST;
  const statusPageSlug = process.env.UPTIME_KUMA_STATUS_PAGE || 'default';

  if (!host) {
    throw new Error('Uptime Kuma configuration missing');
  }

  // Fetch status page config
  const configUrl = `${host}/api/status-page/${statusPageSlug}`;
  console.log('Fetching Uptime Kuma config from:', configUrl);

  const configResponse = await fetchInsecure(configUrl, {
    headers: { 'Accept': 'application/json' },
    timeout: 10000,
  });

  if (!configResponse.ok) {
    const errorText = await configResponse.text().catch(() => 'No response body');
    console.error('Uptime Kuma config response error:', configResponse.status, errorText);
    throw new Error(`Uptime Kuma API error: ${configResponse.status}`);
  }

  const configData: StatusPageResponse = await configResponse.json();
  console.log('Uptime Kuma config response keys:', Object.keys(configData));

  // Fetch heartbeat data from separate endpoint
  const heartbeatUrl = `${host}/api/status-page/heartbeat/${statusPageSlug}`;
  console.log('Fetching Uptime Kuma heartbeat from:', heartbeatUrl);

  let heartbeatData: { heartbeatList?: Record<string, StatusPageHeartbeat[]>; uptimeList?: Record<string, number> } = {};

  try {
    const heartbeatResponse = await fetchInsecure(heartbeatUrl, {
      headers: { 'Accept': 'application/json' },
      timeout: 10000,
    });

    if (heartbeatResponse.ok) {
      heartbeatData = await heartbeatResponse.json();
      console.log('Uptime Kuma heartbeat response keys:', Object.keys(heartbeatData));
    } else {
      console.warn('Heartbeat endpoint returned:', heartbeatResponse.status);
    }
  } catch (err) {
    console.warn('Failed to fetch heartbeat data:', err);
  }

  // Merge the data
  const data = {
    ...configData,
    heartbeatList: heartbeatData.heartbeatList || {},
    uptimeList: heartbeatData.uptimeList || {},
  };

  // Handle different response formats
  const hasValidData = data.publicGroupList || data.config;

  if (!hasValidData) {
    console.error('Uptime Kuma unexpected response:', JSON.stringify(data).substring(0, 500));
    throw new Error('Invalid response from Uptime Kuma - no publicGroupList found');
  }

  const monitors: UptimeKumaMonitor[] = [];
  let upCount = 0;
  let downCount = 0;

  const groups = data.publicGroupList || [];

  for (const group of groups) {
    for (const monitor of group.monitorList || []) {
      const heartbeats = data.heartbeatList?.[monitor.id.toString()] || [];
      const latestHeartbeat = heartbeats[heartbeats.length - 1];

      // Uptime Kuma returns uptime as decimal (0.9987 = 99.87%)
      const rawUptime24h = data.uptimeList?.[`${monitor.id}_24`] || 0;
      const rawUptime30d = data.uptimeList?.[`${monitor.id}_720`] || 0;

      // Convert to percentage
      const uptime24h = rawUptime24h > 1 ? rawUptime24h : rawUptime24h * 100;
      const uptime30d = rawUptime30d > 1 ? rawUptime30d : rawUptime30d * 100;

      const status = latestHeartbeat ? mapStatus(latestHeartbeat.status) : 'pending';

      if (status === 'up') upCount++;
      if (status === 'down') downCount++;

      monitors.push({
        id: monitor.id,
        name: monitor.name,
        type: monitor.type || 'http',
        status,
        uptime24h: Math.round(uptime24h * 100) / 100,
        uptime30d: Math.round(uptime30d * 100) / 100,
        avgPing: latestHeartbeat?.ping || 0,
        lastCheck: latestHeartbeat?.time || new Date().toISOString(),
      });
    }
  }

  const totalMonitors = monitors.length;
  const overallUptime = totalMonitors > 0
    ? monitors.reduce((sum, m) => sum + m.uptime24h, 0) / totalMonitors
    : 0;

  return {
    monitors,
    overallUptime: Math.round(overallUptime * 100) / 100,
    totalMonitors,
    upCount,
    downCount,
  };
}

export async function GET(): Promise<NextResponse<ApiResponse<UptimeKumaData>>> {
  try {
    if (!process.env.UPTIME_KUMA_HOST) {
      throw new Error('Uptime Kuma configuration missing. Set UPTIME_KUMA_HOST environment variable.');
    }

    const data = await fetchUptimeKuma();

    return NextResponse.json({
      success: true,
      data,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Uptime Kuma API Error:', error);

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
