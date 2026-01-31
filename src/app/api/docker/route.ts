import { NextResponse } from 'next/server';
import type { ApiResponse, DockerContainer } from '@/types';
import { fetchInsecure, parseApiError } from '@/lib/fetch-ssl';

interface PortainerContainer {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
  Created: number;
}

async function fetchPortainerContainers(): Promise<DockerContainer[]> {
  const host = process.env.PORTAINER_HOST;
  const apiKey = process.env.PORTAINER_API_KEY;

  if (!host || !apiKey) {
    throw new Error('Portainer configuration missing');
  }

  // Get endpoints first using insecure fetch for self-signed certs
  const endpointsRes = await fetchInsecure(`${host}/api/endpoints`, {
    headers: {
      'X-API-Key': apiKey,
    },
  });

  if (!endpointsRes.ok) {
    throw new Error(`Portainer API error: ${endpointsRes.status}`);
  }

  const endpoints = await endpointsRes.json();

  if (!endpoints.length) {
    return [];
  }

  // Get containers from first endpoint (usually local Docker)
  const endpointId = endpoints[0].Id;
  const containersRes = await fetchInsecure(
    `${host}/api/endpoints/${endpointId}/docker/containers/json?all=true`,
    {
      headers: {
        'X-API-Key': apiKey,
      },
    }
  );

  if (!containersRes.ok) {
    throw new Error(`Portainer containers API error: ${containersRes.status}`);
  }

  const rawContainers: PortainerContainer[] = await containersRes.json();

  return rawContainers.map((container) => ({
    id: container.Id.substring(0, 12),
    name: container.Names[0]?.replace(/^\//, '') || 'unknown',
    status: mapContainerStatus(container.State),
    image: container.Image,
    created: new Date(container.Created * 1000).toISOString(),
    state: container.Status,
  }));
}

function mapContainerStatus(state: string): 'running' | 'stopped' | 'paused' | 'restarting' {
  switch (state.toLowerCase()) {
    case 'running':
      return 'running';
    case 'paused':
      return 'paused';
    case 'restarting':
      return 'restarting';
    default:
      return 'stopped';
  }
}

export async function GET(): Promise<NextResponse<ApiResponse<{ containers: DockerContainer[] }>>> {
  try {
    const containers = await fetchPortainerContainers();

    return NextResponse.json({
      success: true,
      data: {
        containers,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Docker/Portainer API Error:', error);

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
