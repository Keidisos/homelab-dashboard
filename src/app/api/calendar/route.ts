import { NextResponse } from 'next/server';
import type { ApiResponse, CalendarItem, CalendarData } from '@/types';
import { fetchInsecure, parseApiError } from '@/lib/fetch-ssl';

interface SonarrEpisode {
  id: number;
  title: string;
  airDateUtc: string;
  seasonNumber: number;
  episodeNumber: number;
  overview?: string;
  series: {
    id: number;
    title: string;
    images: Array<{ coverType: string; remoteUrl?: string; url?: string }>;
  };
}

interface RadarrMovie {
  id: number;
  title: string;
  overview?: string;
  inCinemas?: string;
  digitalRelease?: string;
  physicalRelease?: string;
  images: Array<{ coverType: string; remoteUrl?: string; url?: string }>;
}

function getPosterUrl(
  images: Array<{ coverType: string; remoteUrl?: string; url?: string }>,
  host: string
): string | undefined {
  const poster = images.find((img) => img.coverType === 'poster');
  if (!poster) return undefined;
  if (poster.remoteUrl) return poster.remoteUrl;
  if (poster.url) return `${host}${poster.url}`;
  return undefined;
}

async function fetchSonarrCalendar(): Promise<CalendarItem[]> {
  const host = process.env.SONARR_HOST;
  const apiKey = process.env.SONARR_API_KEY;

  if (!host || !apiKey) return [];

  const start = new Date().toISOString().split('T')[0];
  const end = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const res = await fetchInsecure(
    `${host}/api/v3/calendar?start=${start}&end=${end}&includeSeries=true`,
    { headers: { 'X-Api-Key': apiKey } }
  );

  if (!res.ok) throw new Error(`Sonarr API error: ${res.status}`);

  const episodes: SonarrEpisode[] = await res.json();

  return episodes.map((ep) => ({
    id: `sonarr-${ep.id}`,
    title: ep.series.title,
    releaseDate: ep.airDateUtc,
    type: 'tv' as const,
    posterUrl: getPosterUrl(ep.series.images, host),
    overview: ep.overview,
    episodeTitle: ep.title,
    seasonNumber: ep.seasonNumber,
    episodeNumber: ep.episodeNumber,
  }));
}

async function fetchRadarrCalendar(): Promise<CalendarItem[]> {
  const host = process.env.RADARR_HOST;
  const apiKey = process.env.RADARR_API_KEY;

  if (!host || !apiKey) return [];

  const start = new Date().toISOString().split('T')[0];
  const end = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const res = await fetchInsecure(
    `${host}/api/v3/calendar?start=${start}&end=${end}`,
    { headers: { 'X-Api-Key': apiKey } }
  );

  if (!res.ok) throw new Error(`Radarr API error: ${res.status}`);

  const movies: RadarrMovie[] = await res.json();

  return movies.map((movie) => ({
    id: `radarr-${movie.id}`,
    title: movie.title,
    releaseDate: movie.digitalRelease || movie.physicalRelease || movie.inCinemas || '',
    type: 'movie' as const,
    posterUrl: getPosterUrl(movie.images, host),
    overview: movie.overview,
  }));
}

export async function GET(): Promise<NextResponse<ApiResponse<CalendarData>>> {
  try {
    const results = await Promise.allSettled([
      fetchSonarrCalendar(),
      fetchRadarrCalendar(),
    ]);

    const sonarrItems = results[0].status === 'fulfilled' ? results[0].value : [];
    const radarrItems = results[1].status === 'fulfilled' ? results[1].value : [];

    if (results[0].status === 'rejected') {
      console.error('Sonarr calendar error:', results[0].reason);
    }
    if (results[1].status === 'rejected') {
      console.error('Radarr calendar error:', results[1].reason);
    }

    const items = [...sonarrItems, ...radarrItems]
      .filter((item) => item.releaseDate)
      .sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime())
      .slice(0, 20);

    if (items.length === 0 && sonarrItems.length === 0 && radarrItems.length === 0) {
      // Both services might not be configured
      const sonarrConfigured = !!process.env.SONARR_HOST && !!process.env.SONARR_API_KEY;
      const radarrConfigured = !!process.env.RADARR_HOST && !!process.env.RADARR_API_KEY;

      if (!sonarrConfigured && !radarrConfigured) {
        return NextResponse.json(
          {
            success: false,
            error: 'Sonarr/Radarr not configured',
            timestamp: Date.now(),
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: { items },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Calendar API Error:', error);

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
