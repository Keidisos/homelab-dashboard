import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import { fetchInsecure, parseApiError } from '@/lib/fetch-ssl';

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

async function fetchQBittorrentTorrents(): Promise<QBittorrentTorrent[]> {
  const host = process.env.QBITTORRENT_HOST;
  const username = process.env.QBITTORRENT_USERNAME || 'admin';
  const password = process.env.QBITTORRENT_PASSWORD || '';

  if (!host) {
    throw new Error('qBittorrent configuration missing');
  }

  // Login to qBittorrent
  const loginRes = await fetchInsecure(`${host}/api/v2/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
  });

  if (!loginRes.ok) {
    throw new Error(`qBittorrent login failed: ${loginRes.status}`);
  }

  // Get cookies from response
  const cookies = loginRes.headers.get('set-cookie') || '';
  const sidMatch = cookies.match(/SID=([^;]+)/);
  const sid = sidMatch ? sidMatch[1] : '';

  if (!sid) {
    // Try without auth (if web UI has no password)
    const torrentsRes = await fetchInsecure(`${host}/api/v2/torrents/info?filter=all`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (torrentsRes.ok) {
      return await torrentsRes.json();
    }
    throw new Error('qBittorrent authentication failed');
  }

  // Fetch torrents with active downloads/uploads
  const torrentsRes = await fetchInsecure(`${host}/api/v2/torrents/info?filter=all`, {
    headers: {
      Cookie: `SID=${sid}`,
      'Content-Type': 'application/json',
    },
  });

  if (!torrentsRes.ok) {
    throw new Error(`qBittorrent API error: ${torrentsRes.status}`);
  }

  const torrents: QBTorrentRaw[] = await torrentsRes.json();

  // Return only active torrents (downloading, uploading, or queued)
  const activeStates = ['downloading', 'uploading', 'stalledDL', 'stalledUP', 'queuedDL', 'queuedUP', 'checkingDL', 'checkingUP', 'forcedDL', 'forcedUP', 'metaDL'];

  return torrents
    .filter((t) => activeStates.includes(t.state) || t.progress < 1)
    .sort((a, b) => b.added_on - a.added_on)
    .slice(0, 15);
}

export async function GET(): Promise<NextResponse<ApiResponse<{ torrents: QBittorrentTorrent[] }>>> {
  try {
    const torrents = await fetchQBittorrentTorrents();

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
