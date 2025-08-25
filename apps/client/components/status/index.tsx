/**
 * Server status component that displays uptime monitoring from BetterStack.
 * Features:
 * - Real-time status updates
 * - Auto-refresh every 15s
 * - Color-coded status indicators
 * - Status descriptions
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { STATUS_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/spinner';

import type { BetterStackResponse, ServiceStatus } from './types';

const REFRESH_INTERVAL = 15000; // 15 seconds

const getServerStatus = (
  monitor: BetterStackResponse['data'],
): ServiceStatus => {
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
      };

    case 'down':
      return {
        color: 'bg-red-600',
        label: 'Server Offline',
        description: 'Server is offline',
      };

    case 'validating':
    case 'pending':
      return {
        color: 'bg-yellow-600',
        label: 'Server Connecting',
        description: 'Server is connecting',
      };

    case 'up':
      return {
        color: 'bg-green-600',
        label: 'Server Online',
        description: 'Server is online',
      };

    default:
      return {
        color: 'bg-yellow-600',
        label: 'Server Issues',
        description: 'Server experiencing issues',
      };
  }
};

const Status = () => {
  const [systemStatus, setSystemStatus] = useState<ServiceStatus>({
    color: 'bg-muted-foreground',
    label: 'Unknown Server Status',
    description: 'Unable to fetch server status',
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/status', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      const { data } = (await response.json()) as BetterStackResponse;
      setSystemStatus(getServerStatus(data));
    } catch (error) {
      console.error('Error fetching server status:', error);
      setSystemStatus({
        color: 'bg-muted-foreground',
        label: 'Error Fetching Server Status',
        description: 'Failed to fetch server status',
      });
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
        `text-foreground/70 hover:text-foreground/50 flex items-center gap-x-2 text-sm
        underline-offset-2 transition-all hover:underline`,
        isInitialLoad && 'cursor-wait',
      )}
      href={STATUS_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={`Server Status: ${systemStatus.description}`}
    >
      {isInitialLoad ? (
        <>
          <Spinner />
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
          <span aria-hidden="true">{systemStatus.label}</span>
        </>
      )}
    </a>
  );
};

export { Status };
