import { NextResponse } from 'next/server';
import type { ApiResponse, JellyfinData, JellyfinSession } from '@/types';

interface RawJellyfinSession {
  Id: string;
  UserName: string;
  Client: string;
  DeviceName: string;
  NowPlayingItem?: {
    Name: string;
    SeriesName?: string;
    Type: string;
  };
  PlayState?: {
    IsPaused: boolean;
    PositionTicks: number;
  };
}

async function fetchJellyfinSessions(): Promise<JellyfinData> {
  const host = process.env.JELLYFIN_HOST;
  const apiKey = process.env.JELLYFIN_API_KEY;

  if (!host || !apiKey) {
    throw new Error('Jellyfin configuration missing');
  }

  const response = await fetch(`${host}/Sessions`, {
    headers: {
      'X-Emby-Token': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Jellyfin API error: ${response.status}`);
  }

  const rawSessions: RawJellyfinSession[] = await response.json();

  // Filter sessions that are actively playing something
  const activeSessions = rawSessions.filter((s) => s.NowPlayingItem);

  const sessions: JellyfinSession[] = rawSessions.map((session) => ({
    id: session.Id,
    userName: session.UserName,
    client: session.Client,
    deviceName: session.DeviceName,
    nowPlayingItem: session.NowPlayingItem
      ? {
          name: session.NowPlayingItem.Name,
          seriesName: session.NowPlayingItem.SeriesName,
          type: session.NowPlayingItem.Type,
        }
      : undefined,
    playState: session.PlayState
      ? {
          isPaused: session.PlayState.IsPaused,
          positionTicks: session.PlayState.PositionTicks,
        }
      : undefined,
  }));

  return {
    activeSessions: activeSessions.length,
    sessions: sessions.filter((s) => s.nowPlayingItem), // Only return active ones
  };
}

export async function GET(): Promise<NextResponse<ApiResponse<JellyfinData>>> {
  try {
    const data = await fetchJellyfinSessions();

    return NextResponse.json({
      success: true,
      data,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Jellyfin API Error:', error);

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
