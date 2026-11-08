/**
 * API route handler for fetching server status from BetterStack.
 * Features:
 * - Uptime monitoring status
 * - Error handling
 * - Status response formatting
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { NextResponse } from "next/server";
import type { BetterStackResponse } from "@/components/status/types";
import { KASCA_SERVER_MONITOR_ID } from "@/lib/constants";

// Better Stack only checks the server every few minutes, so a short-lived
// copy answers most requests without calling its API again
const CACHE_DURATION_MS = 30_000;

let cached: { expiresAt: number; status: string | null } | null = null;

export async function GET() {
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ status: cached.status });
  }

  try {
    const response = await fetch(
      `https://uptime.betterstack.com/api/v2/monitors/${KASCA_SERVER_MONITOR_ID}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.BETTERSTACK_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch status");
    }

    const { data } = (await response.json()) as BetterStackResponse;
    const status = data?.attributes.status ?? null;
    cached = { expiresAt: Date.now() + CACHE_DURATION_MS, status };
    return NextResponse.json({ status });
  } catch (error) {
    console.error("Error fetching server status:", error);
    return NextResponse.json(
      { error: "Failed to fetch server status" },
      { status: 500 }
    );
  }
}
