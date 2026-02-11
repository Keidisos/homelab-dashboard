import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import { fetchInsecure, parseApiError } from '@/lib/fetch-ssl';

function stripDockerHeaders(rawLogs: string): string {
  // Docker stream multiplexing: each frame has an 8-byte header
  // Byte 0: stream type (1=stdout, 2=stderr)
  // Bytes 1-3: padding
  // Bytes 4-7: frame size (big-endian)
  // We detect binary headers and strip them
  const lines = rawLogs.split('\n');
  return lines
    .map((line) => {
      // Strip ANSI escape codes
      let cleaned = line.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
      // Strip Docker stream header bytes (non-printable at start of line)
      cleaned = cleaned.replace(/^[\x00-\x08].{0,7}/, '');
      return cleaned;
    })
    .filter((line) => line.trim().length > 0)
    .join('\n');
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<{ logs: string; containerId: string; containerName: string }>>> {
  try {
    const host = process.env.PORTAINER_HOST;
    const apiKey = process.env.PORTAINER_API_KEY;

    if (!host || !apiKey) {
      throw new Error('Portainer configuration missing');
    }

    const containerId = request.nextUrl.searchParams.get('containerId');
    const tail = request.nextUrl.searchParams.get('tail') || '100';

    if (!containerId) {
      return NextResponse.json(
        { success: false, error: 'containerId is required', timestamp: Date.now() },
        { status: 400 }
      );
    }

    // Get endpoints to find endpointId
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

    const endpointId = endpoints[0].Id;

    // Fetch container logs
    const logsRes = await fetchInsecure(
      `${host}/api/endpoints/${endpointId}/docker/containers/${containerId}/logs?stdout=true&stderr=true&tail=${tail}&timestamps=true`,
      {
        headers: { 'X-API-Key': apiKey },
        timeout: 30000,
      }
    );

    if (!logsRes.ok) {
      throw new Error(`Docker logs API error: ${logsRes.status}`);
    }

    const rawLogs = await logsRes.text();
    const logs = stripDockerHeaders(rawLogs);

    // Get container name
    const inspectRes = await fetchInsecure(
      `${host}/api/endpoints/${endpointId}/docker/containers/${containerId}/json`,
      { headers: { 'X-API-Key': apiKey } }
    );

    let containerName = containerId;
    if (inspectRes.ok) {
      const inspectData = await inspectRes.json();
      containerName = inspectData.Name?.replace(/^\//, '') || containerId;
    }

    return NextResponse.json({
      success: true,
      data: { logs, containerId, containerName },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Docker Logs API Error:', error);

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
