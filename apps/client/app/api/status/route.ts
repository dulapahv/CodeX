/**
 * API route handler for fetching server status from BetterStack.
 * Features:
 * - Uptime monitoring status
 * - Error handling
 * - Status response formatting
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { NextResponse } from 'next/server';

import { KASCA_SERVER_MONITOR_ID } from '@/lib/constants';
import type { BetterStackResponse } from '@/components/status/types';

// export const runtime = 'edge';

export async function GET() {
  try {
    const response = await fetch(
      `https://uptime.betterstack.com/api/v2/monitors/${KASCA_SERVER_MONITOR_ID}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.BETTERSTACK_API_KEY}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch status');
    }

    const data = (await response.json()) as BetterStackResponse;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching server status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch server status' },
      { status: 500 },
    );
  }
}
