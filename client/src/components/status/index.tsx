import { BASE_SERVER_URL, STATUS_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';

import type { BetterStackResponse, ServiceStatus } from './types';

const getServerStatus = (
  monitors: BetterStackResponse['data'],
): ServiceStatus => {
  // Find the server monitor
  const serverMonitor = monitors.find(
    (monitor) => monitor.attributes.url === BASE_SERVER_URL,
  );

  if (!serverMonitor) {
    return {
      color: 'bg-muted-foreground',
      label: 'Unknown',
      description: 'Unable to fetch server status',
    };
  }

  // Check server status
  switch (serverMonitor.attributes.status) {
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

const Status = async () => {
  let systemStatus: ServiceStatus = {
    color: 'bg-muted-foreground',
    label: 'Unknown',
    description: 'Unable to fetch server status',
  };

  try {
    const response = await fetch(
      'https://uptime.betterstack.com/api/v2/monitors',
      {
        headers: {
          Authorization: `Bearer ${process.env.BETTERSTACK_API_KEY}`,
        },
        next: { revalidate: 30 },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch status');
    }

    const { data } = (await response.json()) as BetterStackResponse;
    systemStatus = getServerStatus(data);
  } catch (error) {
    console.error('Error fetching server status:', error);
  }

  return (
    <a
      className="flex items-center gap-3 text-sm text-foreground/70 underline-offset-2 transition-all hover:text-foreground/50 hover:underline"
      href={STATUS_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={`Server Status: ${systemStatus.description}`}
    >
      <span
        className="relative flex size-2"
        role="status"
        aria-label={systemStatus.label}
      >
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
            systemStatus.color,
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            'relative inline-flex h-2 w-2 rounded-full',
            systemStatus.color,
          )}
          aria-hidden="true"
        />
      </span>
      <span aria-hidden="true">{systemStatus.label}</span>
    </a>
  );
};

export { Status };
