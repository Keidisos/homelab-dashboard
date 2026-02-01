import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import { fetchInsecure, parseApiError } from '@/lib/fetch-ssl';

type VMAction = 'start' | 'stop' | 'shutdown' | 'reboot';
type VMType = 'qemu' | 'lxc';

interface ActionRequest {
  node: string;
  vmid: number;
  type: VMType;
  action: VMAction;
}

async function executeVMAction(
  node: string,
  vmid: number,
  type: VMType,
  action: VMAction
): Promise<string> {
  const host = process.env.PROXMOX_HOST;
  const tokenId = process.env.PROXMOX_TOKEN_ID;
  const tokenSecret = process.env.PROXMOX_TOKEN_SECRET;

  if (!host || !tokenId || !tokenSecret) {
    throw new Error('Proxmox configuration missing');
  }

  // Map action names for Proxmox API
  const proxmoxAction = action === 'stop' ? 'stop' : action;

  const url = `${host}/api2/json/nodes/${node}/${type}/${vmid}/status/${proxmoxAction}`;

  const response = await fetchInsecure(url, {
    method: 'POST',
    headers: {
      Authorization: `PVEAPIToken=${tokenId}=${tokenSecret}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Proxmox API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result.data; // Returns task ID (UPID)
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ message: string; taskId?: string }>>> {
  try {
    const body: ActionRequest = await request.json();
    const { node, vmid, type, action } = body;

    if (!node || !vmid || !type || !action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: node, vmid, type, action',
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    if (!['qemu', 'lxc'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid type. Must be qemu or lxc',
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    if (!['start', 'stop', 'shutdown', 'reboot'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Must be start, stop, shutdown, or reboot',
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    const taskId = await executeVMAction(node, vmid, type, action);

    return NextResponse.json({
      success: true,
      data: {
        message: `${type.toUpperCase()} ${vmid} ${action} initiated`,
        taskId
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Proxmox action error:', error);

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
