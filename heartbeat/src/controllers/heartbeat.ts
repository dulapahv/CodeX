import axios from 'axios';
import { Request, Response } from 'express';

import { PROD_SERVER_URL } from '../../../common/constants';

const TIMEOUT_MS = 5000; // 5 second timeout

interface PingResult {
  timestamp: string;
  success: boolean;
  responseTime: number;
  error?: string;
}

let lastPingResult: PingResult | null = null;

async function pingServer(): Promise<PingResult> {
  const startTime = Date.now();
  try {
    await axios.get(PROD_SERVER_URL, {
      timeout: TIMEOUT_MS,
      validateStatus: (status) => status === 200, // Only accept 200 as success
    });

    const result: PingResult = {
      timestamp: new Date().toISOString(),
      success: true,
      responseTime: Date.now() - startTime,
    };

    console.log(`✅ Ping successful - Response time: ${result.responseTime}ms`);
    return result;
  } catch (error) {
    const result: PingResult = {
      timestamp: new Date().toISOString(),
      success: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    console.error(`❌ Ping failed - ${result.error}`);
    return result;
  }
}

export const heartbeatController = async (req: Request, res: Response) => {
  try {
    // Perform the ping
    const result = await pingServer();
    lastPingResult = result;

    // Return detailed status
    res.status(200).json({
      status: 'OK',
      lastPing: result,
      uptime: process.uptime(),
    });
  } catch (error) {
    console.error('Heartbeat controller error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      lastPing: lastPingResult,
    });
  }
};
