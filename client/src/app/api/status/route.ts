import { NextResponse } from 'next/server';

import type { BetterStackResponse } from '@/components/status/types';

export async function GET() {
  try {
    const response = await fetch(
      'https://uptime.betterstack.com/api/v2/monitors',
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
