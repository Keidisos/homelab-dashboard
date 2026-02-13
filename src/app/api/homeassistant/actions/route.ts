import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import { fetchInsecure, parseApiError } from '@/lib/fetch-ssl';

interface ActionRequest {
  entity_id: string;
  action: 'turn_on' | 'turn_off' | 'toggle';
  brightness?: number;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    const body: ActionRequest = await request.json();
    const { entity_id, action, brightness } = body;

    if (!entity_id || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing entity_id or action', timestamp: Date.now() },
        { status: 400 }
      );
    }

    if (!['turn_on', 'turn_off', 'toggle'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be turn_on, turn_off, or toggle', timestamp: Date.now() },
        { status: 400 }
      );
    }

    const host = process.env.HOMEASSISTANT_HOST;
    const token = process.env.HOMEASSISTANT_TOKEN;

    if (!host || !token) {
      throw new Error('Home Assistant configuration missing');
    }

    const domain = entity_id.split('.')[0];
    if (!['light', 'switch'].includes(domain)) {
      return NextResponse.json(
        { success: false, error: 'Invalid entity domain. Must be light or switch', timestamp: Date.now() },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = { entity_id };
    if (brightness !== undefined && domain === 'light' && action === 'turn_on') {
      payload.brightness = brightness;
    }

    const response = await fetchInsecure(`${host}/api/services/${domain}/${action}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Home Assistant service call failed: ${response.status} - ${errorText}`);
    }

    return NextResponse.json({
      success: true,
      data: { message: `${entity_id} ${action} successful` },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Home Assistant action error:', error);
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
