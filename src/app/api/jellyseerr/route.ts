import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import { fetchInsecure, parseApiError } from '@/lib/fetch-ssl';

export interface JellyseerrRequest {
  id: number;
  type: 'movie' | 'tv';
  status: number;
  mediaStatus: number;
  media: {
    id: number;
    tmdbId: number;
    tvdbId?: number;
    mediaType: string;
    status: number;
  };
  requestedBy: {
    id: number;
    displayName: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  title?: string;
  posterPath?: string;
}

interface JellyseerrApiRequest {
  id: number;
  type: 'movie' | 'tv';
  status: number;
  media: {
    id: number;
    tmdbId: number;
    tvdbId?: number;
    mediaType: string;
    status: number;
    externalServiceSlug?: string;
  };
  requestedBy: {
    id: number;
    displayName: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface MediaDetails {
  title?: string;
  name?: string;
  posterPath?: string;
}

// Request status (from Jellyseerr)
// 1 = Pending Approval
// 2 = Approved
// 3 = Declined

// Media status (actual availability)
// 1 = Unknown
// 2 = Pending
// 3 = Processing
// 4 = Partially Available
// 5 = Available

const STATUS_LABELS: Record<number, string> = {
  1: 'Pending',
  2: 'Approved',
  3: 'Declined',
  4: 'Partial',
  5: 'Available',
};

function getEffectiveStatus(requestStatus: number, mediaStatus: number): number {
  // If media is available (5) or partially available (4), show that
  if (mediaStatus === 5) return 5; // Available
  if (mediaStatus === 4) return 4; // Partial

  // If request is declined, show declined
  if (requestStatus === 3) return 3; // Declined

  // If media is processing (3), show processing
  if (mediaStatus === 3) return 3; // We'll map this to "Processing" in frontend

  // If request is approved but media not ready, show approved/processing
  if (requestStatus === 2) return 2; // Approved (processing)

  // Default to pending
  return 1; // Pending
}

async function fetchJellyseerrRequests(): Promise<JellyseerrRequest[]> {
  const host = process.env.JELLYSEERR_HOST;
  const apiKey = process.env.JELLYSEERR_API_KEY;

  if (!host || !apiKey) {
    throw new Error('Jellyseerr configuration missing');
  }

  // Fetch recent requests
  const requestsRes = await fetchInsecure(`${host}/api/v1/request?take=15&skip=0&sort=added`, {
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!requestsRes.ok) {
    throw new Error(`Jellyseerr API error: ${requestsRes.status}`);
  }

  const data = await requestsRes.json();
  const requests: JellyseerrApiRequest[] = data.results || [];

  // Fetch media details for each request
  const enrichedRequests = await Promise.all(
    requests.map(async (req) => {
      try {
        const mediaType = req.type === 'movie' ? 'movie' : 'tv';
        const detailsRes = await fetchInsecure(`${host}/api/v1/${mediaType}/${req.media.tmdbId}`, {
          headers: {
            'X-Api-Key': apiKey,
            'Content-Type': 'application/json',
          },
        });

        if (detailsRes.ok) {
          const details: MediaDetails = await detailsRes.json();
          return {
            ...req,
            mediaStatus: req.media.status,
            status: getEffectiveStatus(req.status, req.media.status),
            title: details.title || details.name || 'Unknown',
            posterPath: details.posterPath,
          };
        }
      } catch {
        // Ignore errors fetching details
      }

      return {
        ...req,
        mediaStatus: req.media.status,
        status: getEffectiveStatus(req.status, req.media.status),
        title: 'Unknown',
        posterPath: undefined,
      };
    })
  );

  return enrichedRequests;
}

export async function GET(): Promise<NextResponse<ApiResponse<{ requests: JellyseerrRequest[]; statusLabels: Record<number, string> }>>> {
  try {
    const requests = await fetchJellyseerrRequests();

    return NextResponse.json({
      success: true,
      data: {
        requests,
        statusLabels: STATUS_LABELS,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Jellyseerr API Error:', error);

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
