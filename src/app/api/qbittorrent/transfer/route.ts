import { NextResponse } from 'next/server';
import type { ApiResponse, QBittorrentTransferInfo } from '@/types';
import { fetchInsecure, parseApiError } from '@/lib/fetch-ssl';
import { getQBittorrentAuth } from '@/lib/qbittorrent-auth';

export async function GET(): Promise<NextResponse<ApiResponse<QBittorrentTransferInfo>>> {
  try {
    const { host, cookie } = await getQBittorrentAuth();

    const headers: Record<string, string> = {};
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    const res = await fetchInsecure(`${host}/api/v2/transfer/info`, { headers });

    if (!res.ok) {
      throw new Error(`qBittorrent transfer info error: ${res.status}`);
    }

    const data = await res.json();

    return NextResponse.json({
      success: true,
      data: {
        dl_info_speed: data.dl_info_speed || 0,
        up_info_speed: data.up_info_speed || 0,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('qBittorrent Transfer Error:', error);

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
