import { NextRequest, NextResponse } from 'next/server';
import { getMetrics, getNodeIds } from '@/lib/metrics-db';
import type { ApiResponse } from '@/types';

export interface MetricsData {
  nodeId: string;
  range: string;
  points: Array<{
    timestamp: number;
    cpu_percent: number;
    ram_percent: number;
  }>;
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<MetricsData>>> {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '1h';
    const nodeId = searchParams.get('node');

    if (!['1h', '6h', '24h', '7d'].includes(range)) {
      return NextResponse.json(
        { success: false, error: 'Invalid range. Use: 1h, 6h, 24h, 7d', timestamp: Date.now() },
        { status: 400 }
      );
    }

    // If no node specified, use the first known node
    const resolvedNodeId = nodeId || getNodeIds()[0] || 'pve';

    const points = getMetrics(resolvedNodeId, range as '1h' | '6h' | '24h' | '7d');

    return NextResponse.json({
      success: true,
      data: { nodeId: resolvedNodeId, range, points },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Metrics API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query metrics',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
