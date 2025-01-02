'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { BASE_SERVER_URL, STATUS_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';

import type { BetterStackResponse, ServiceStatus } from './types';

const REFRESH_INTERVAL = 15000; // 15 seconds

interface ServerStatus extends ServiceStatus {
  responseTime?: number;
}

const getServerStatus = (
  monitor: BetterStackResponse['data'],
  responseTime?: number,
): ServerStatus => {
  if (!monitor) {
    return {
      color: 'bg-muted-foreground',
      label: 'Unknown Server Status',
      description: 'Unable to fetch server status',
    };
  }

  // Check server status
  switch (monitor.attributes.status) {
    case 'maintenance':
    case 'paused':
      return {
        color: 'bg-blue-600',
        label: 'Server Maintenance',
        description: 'Server under maintenance',
        responseTime,
      };

    case 'down':
      return {
        color: 'bg-red-600',
        label: 'Server Offline',
        description: 'Server is offline',
        responseTime,
      };

    case 'validating':
    case 'pending':
      return {
        color: 'bg-yellow-600',
        label: 'Server Connecting',
        description: 'Server is connecting',
        responseTime,
      };

    case 'up':
      return {
        color: 'bg-green-600',
        label: 'Server Online',
        description: 'Server is online',
        responseTime,
      };

    default:
      return {
        color: 'bg-yellow-600',
        label: 'Server Issues',
        description: 'Server experiencing issues',
        responseTime,
      };
  }
};

const pingServer = async (): Promise<number> => {
  const startTime = performance.now();

  try {
    const response = await fetch(`${BASE_SERVER_URL}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Ping failed');
    }

    const endTime = performance.now();
    return Math.round(endTime - startTime);
  } catch {
    throw new Error('Server unreachable');
  }
};

const Status = () => {
  const [systemStatus, setSystemStatus] = useState<ServerStatus>({
    color: 'bg-muted-foreground',
    label: 'Unknown Server Status',
    description: 'Unable to fetch server status',
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      // First try to ping the server
      const responseTime = await pingServer();

      // Only fetch BetterStack status if ping succeeds
      const response = await fetch('/api/status', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      const { data } = (await response.json()) as BetterStackResponse;
      setSystemStatus(getServerStatus(data, responseTime));
    } catch (error) {
      console.error('Error fetching server status:', error);
      // If it's a ping error, show offline status
      if (error instanceof Error && error.message === 'Server unreachable') {
        setSystemStatus({
          color: 'bg-red-600',
          label: 'Server Offline',
          description: 'Server is unreachable',
        });
      } else {
        setSystemStatus({
          color: 'bg-muted-foreground',
          label: 'Error Fetching Server Status',
          description: 'Failed to fetch server status',
        });
      }
    } finally {
      setIsInitialLoad(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    const intervalId = setInterval(() => {
      setIsRefreshing(true);
      fetchStatus();
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchStatus]);

  return (
    <a
      className={cn(
        'flex items-center gap-x-2 text-sm text-foreground/70 underline-offset-2 transition-all hover:text-foreground/50 hover:underline',
        isInitialLoad && 'cursor-wait',
      )}
      href={STATUS_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={`Server Status: ${systemStatus.description}${
        systemStatus.responseTime
          ? ` with ${systemStatus.responseTime}ms response time`
          : ''
      }`}
    >
      {isInitialLoad ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span>Checking Server Status...</span>
        </>
      ) : (
        <>
          <span
            className="relative flex size-2"
            role="status"
            aria-label={systemStatus.label}
          >
            <span
              className={cn(
                'absolute inline-flex size-full animate-ping rounded-full opacity-75',
                systemStatus.color,
                isRefreshing && 'animate-pulse',
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                'relative inline-flex size-2 rounded-full',
                systemStatus.color,
              )}
              aria-hidden="true"
            />
          </span>
          <span aria-hidden="true">
            {systemStatus.label}
            {systemStatus.responseTime !== undefined &&
              ` (${systemStatus.responseTime}ms)`}
          </span>
        </>
      )}
    </a>
  );
};

export { Status };
