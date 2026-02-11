import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import { parseApiError } from '@/lib/fetch-ssl';
import { fetchInsecure } from '@/lib/fetch-ssl';
import { getQBittorrentAuth } from '@/lib/qbittorrent-auth';

export interface QBittorrentTorrent {
  hash: string;
  name: string;
  size: number;
  progress: number;
  dlspeed: number;
  upspeed: number;
  state: string;
  eta: number;
  category: string;
  added_on: number;
}

interface QBTorrentRaw {
  hash: string;
  name: string;
  size: number;
  progress: number;
  dlspeed: number;
  upspeed: number;
  state: string;
  eta: number;
  category: string;
  added_on: number;
}

async function fetchQBittorrentTorrents(showAll: boolean): Promise<QBittorrentTorrent[]> {
  const { host, cookie } = await getQBittorrentAuth();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (cookie) {
    headers['Cookie'] = cookie;
  }

  const torrentsRes = await fetchInsecure(`${host}/api/v2/torrents/info?filter=all`, {
    headers,
  });

  if (!torrentsRes.ok) {
    throw new Error(`qBittorrent API error: ${torrentsRes.status}`);
  }

  const torrents: QBTorrentRaw[] = await torrentsRes.json();

  if (showAll) {
    return torrents.sort((a, b) => b.added_on - a.added_on);
  }

  // Return only active torrents (downloading, uploading, or queued)
  const activeStates = ['downloading', 'uploading', 'stalledDL', 'stalledUP', 'queuedDL', 'queuedUP', 'checkingDL', 'checkingUP', 'forcedDL', 'forcedUP', 'metaDL'];

  return torrents
    .filter((t) => activeStates.includes(t.state) || t.progress < 1)
    .sort((a, b) => b.added_on - a.added_on)
    .slice(0, 15);
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<{ torrents: QBittorrentTorrent[] }>>> {
  try {
    const showAll = request.nextUrl.searchParams.get('all') === 'true';
    const torrents = await fetchQBittorrentTorrents(showAll);

    return NextResponse.json({
      success: true,
      data: {
        torrents,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('qBittorrent API Error:', error);

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
