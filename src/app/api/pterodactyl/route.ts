import { NextResponse } from 'next/server';
import type { ApiResponse, PterodactylData, PterodactylServer } from '@/types';

// Application API types (ptla_ key)
interface RawApplicationServer {
  attributes: {
    id: number;
    uuid: string;
    identifier: string;
    name: string;
    description: string;
    suspended: boolean;
    limits: {
      memory: number;
      disk: number;
      cpu: number;
    };
    feature_limits: {
      databases: number;
      backups: number;
    };
  };
}

// Client API types (ptlc_ key)
interface RawClientServer {
  attributes: {
    identifier: string;
    name: string;
    node: string;
    is_suspended: boolean;
    is_installing: boolean;
    limits: {
      memory: number;
      disk: number;
      cpu: number;
    };
  };
}

interface RawServerResources {
  attributes: {
    current_state: string;
    resources: {
      memory_bytes: number;
      cpu_absolute: number;
      disk_bytes: number;
    };
  };
}

// Detect API key type and use appropriate endpoint
function getApiType(apiKey: string): 'application' | 'client' {
  if (apiKey.startsWith('ptla_')) {
    return 'application';
  }
  return 'client';
}

async function fetchWithApplicationAPI(host: string, apiKey: string): Promise<PterodactylServer[]> {
  // Application API uses /api/application/servers
  const serversRes = await fetch(`${host}/api/application/servers`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!serversRes.ok) {
    const errorText = await serversRes.text();
    throw new Error(`Pterodactyl Application API error: ${serversRes.status} - ${errorText}`);
  }

  const serversData = await serversRes.json();
  const rawServers: RawApplicationServer[] = serversData.data || [];

  // Application API doesn't provide real-time resources, just config
  return rawServers.map((server) => ({
    id: server.attributes.identifier,
    name: server.attributes.name,
    status: server.attributes.suspended ? 'offline' : 'running',
    memory: {
      current: 0, // Not available via Application API
      limit: server.attributes.limits.memory,
    },
    cpu: {
      current: 0,
      limit: server.attributes.limits.cpu,
    },
    disk: {
      current: 0,
      limit: server.attributes.limits.disk,
    },
  }));
}

async function fetchWithClientAPI(host: string, apiKey: string): Promise<PterodactylServer[]> {
  // Client API uses /api/client
  const serversRes = await fetch(`${host}/api/client`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!serversRes.ok) {
    throw new Error(`Pterodactyl Client API error: ${serversRes.status}`);
  }

  const serversData = await serversRes.json();
  const rawServers: RawClientServer[] = serversData.data || [];

  // Fetch resources for each server
  const servers: PterodactylServer[] = await Promise.all(
    rawServers.map(async (server) => {
      try {
        const resourcesRes = await fetch(
          `${host}/api/client/servers/${server.attributes.identifier}/resources`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              Accept: 'application/json',
            },
            cache: 'no-store',
          }
        );

        if (resourcesRes.ok) {
          const resourcesData: RawServerResources = await resourcesRes.json();
          const resources = resourcesData.attributes.resources;
          const state = resourcesData.attributes.current_state;

          return {
            id: server.attributes.identifier,
            name: server.attributes.name,
            status: mapServerStatus(state),
            memory: {
              current: Math.round(resources.memory_bytes / (1024 * 1024)),
              limit: server.attributes.limits.memory,
            },
            cpu: {
              current: Math.round(resources.cpu_absolute),
              limit: server.attributes.limits.cpu,
            },
            disk: {
              current: Math.round(resources.disk_bytes / (1024 * 1024)),
              limit: server.attributes.limits.disk,
            },
          };
        }
      } catch {
        // If we can't get resources, return basic info
      }

      return {
        id: server.attributes.identifier,
        name: server.attributes.name,
        status: server.attributes.is_suspended ? 'offline' : 'offline',
        memory: { current: 0, limit: server.attributes.limits.memory },
        cpu: { current: 0, limit: server.attributes.limits.cpu },
        disk: { current: 0, limit: server.attributes.limits.disk },
      };
    })
  );

  return servers;
}

async function fetchPterodactylServers(): Promise<PterodactylServer[]> {
  const host = process.env.PTERODACTYL_HOST;
  const apiKey = process.env.PTERODACTYL_API_KEY;

  if (!host || !apiKey) {
    throw new Error('Pterodactyl configuration missing');
  }

  const apiType = getApiType(apiKey);

  if (apiType === 'application') {
    return fetchWithApplicationAPI(host, apiKey);
  } else {
    return fetchWithClientAPI(host, apiKey);
  }
}

function mapServerStatus(state: string): 'running' | 'starting' | 'stopping' | 'offline' {
  switch (state.toLowerCase()) {
    case 'running':
      return 'running';
    case 'starting':
      return 'starting';
    case 'stopping':
      return 'stopping';
    default:
      return 'offline';
  }
}

export async function GET(): Promise<NextResponse<ApiResponse<PterodactylData>>> {
  try {
    const servers = await fetchPterodactylServers();

    return NextResponse.json({
      success: true,
      data: { servers },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Pterodactyl API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
