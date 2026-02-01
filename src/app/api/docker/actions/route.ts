import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import { fetchInsecure, parseApiError } from '@/lib/fetch-ssl';

type ContainerAction = 'start' | 'stop' | 'restart';

interface ActionRequest {
  containerId: string;
  action: ContainerAction;
}

async function getEndpointId(): Promise<number> {
  const host = process.env.PORTAINER_HOST;
  const apiKey = process.env.PORTAINER_API_KEY;

  if (!host || !apiKey) {
    throw new Error('Portainer configuration missing');
  }

  const endpointsRes = await fetchInsecure(`${host}/api/endpoints`, {
    headers: { 'X-API-Key': apiKey },
  });

  if (!endpointsRes.ok) {
    throw new Error(`Portainer API error: ${endpointsRes.status}`);
  }

  const endpoints = await endpointsRes.json();
  if (!endpoints.length) {
    throw new Error('No Portainer endpoints found');
  }

  return endpoints[0].Id;
}

async function executeContainerAction(
  containerId: string,
  action: ContainerAction
): Promise<void> {
  const host = process.env.PORTAINER_HOST;
  const apiKey = process.env.PORTAINER_API_KEY;

  if (!host || !apiKey) {
    throw new Error('Portainer configuration missing');
  }

  const endpointId = await getEndpointId();

  const response = await fetchInsecure(
    `${host}/api/endpoints/${endpointId}/docker/containers/${containerId}/${action}`,
    {
      method: 'POST',
      headers: { 'X-API-Key': apiKey },
    }
  );

  // Docker API returns 204 for successful actions, 304 for already in that state
  if (!response.ok && response.status !== 204 && response.status !== 304) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Container ${action} failed: ${response.status} - ${errorText}`);
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    const body: ActionRequest = await request.json();
    const { containerId, action } = body;

    if (!containerId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing containerId or action',
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    if (!['start', 'stop', 'restart'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Must be start, stop, or restart',
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    await executeContainerAction(containerId, action);

    return NextResponse.json({
      success: true,
      data: { message: `Container ${action} successful` },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Docker action error:', error);

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
