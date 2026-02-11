import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import { fetchInsecure, parseApiError } from '@/lib/fetch-ssl';
import { getQBittorrentAuth } from '@/lib/qbittorrent-auth';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    const { action, hash, magnetUrl } = await request.json();

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required', timestamp: Date.now() },
        { status: 400 }
      );
    }

    const { host, cookie } = await getQBittorrentAuth();

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    let url: string;
    let body: string;

    switch (action) {
      case 'pause':
        if (!hash) throw new Error('Hash is required for pause action');
        url = `${host}/api/v2/torrents/pause`;
        body = `hashes=${hash}`;
        break;
      case 'resume':
        if (!hash) throw new Error('Hash is required for resume action');
        url = `${host}/api/v2/torrents/resume`;
        body = `hashes=${hash}`;
        break;
      case 'delete':
        if (!hash) throw new Error('Hash is required for delete action');
        url = `${host}/api/v2/torrents/delete`;
        body = `hashes=${hash}&deleteFiles=false`;
        break;
      case 'add':
        if (!magnetUrl) throw new Error('Magnet URL is required for add action');
        url = `${host}/api/v2/torrents/add`;
        body = `urls=${encodeURIComponent(magnetUrl)}`;
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}`, timestamp: Date.now() },
          { status: 400 }
        );
    }

    const res = await fetchInsecure(url, {
      method: 'POST',
      headers,
      body,
    });

    if (!res.ok) {
      throw new Error(`qBittorrent action failed: ${res.status}`);
    }

    return NextResponse.json({
      success: true,
      data: { message: `Action '${action}' completed successfully` },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('qBittorrent Action Error:', error);

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
