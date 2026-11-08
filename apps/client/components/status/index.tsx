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

"use client";

import { useCallback, useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { STATUS_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

import type { BetterStackResponse, ServiceStatus } from "./types";

type MonitorStatus = BetterStackResponse["data"]["attributes"]["status"];

// Better Stack checks the server every few minutes, so polling faster adds nothing
const REFRESH_INTERVAL = 60_000;

const getServerStatus = (status: MonitorStatus | null): ServiceStatus => {
  if (!status) {
    return {
      color: "bg-muted-foreground",
      description: "Unable to fetch server status",
      label: "Unknown Server Status",
    };
  }

  // Check server status
  switch (status) {
    case "maintenance":
    case "paused":
      return {
        color: "bg-blue-600",
        description: "Server under maintenance",
        label: "Server Maintenance",
      };

    case "down":
      return {
        color: "bg-red-600",
        description: "Server is offline",
        label: "Server Offline",
      };

    case "validating":
    case "pending":
      return {
        color: "bg-yellow-600",
        description: "Server is connecting",
        label: "Server Connecting",
      };

    case "up":
      return {
        color: "bg-green-600",
        description: "Server is online",
        label: "Server Online",
      };

    default:
      return {
        color: "bg-yellow-600",
        description: "Server experiencing issues",
        label: "Server Issues",
      };
  }
};

const Status = () => {
  const [systemStatus, setSystemStatus] = useState<ServiceStatus>({
    color: "bg-muted-foreground",
    description: "Unable to fetch server status",
    label: "Unknown Server Status",
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/status", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch status");
      }

      const { status } = (await response.json()) as {
        status: MonitorStatus | null;
      };
      setSystemStatus(getServerStatus(status));
    } catch (error) {
      console.error("Error fetching server status:", error);
      setSystemStatus({
        color: "bg-muted-foreground",
        description: "Failed to fetch server status",
        label: "Error Fetching Server Status",
      });
    } finally {
      setIsInitialLoad(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    const intervalId = setInterval(() => {
      if (document.hidden) {
        return;
      }
      setIsRefreshing(true);
      fetchStatus();
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchStatus]);

  return (
    <a
      aria-label={`Server Status: ${systemStatus.description}`}
      className={cn(
        "text-foreground/70 hover:text-foreground/50 flex items-center gap-x-2 text-sm underline-offset-2 transition-all hover:underline",
        isInitialLoad && "cursor-wait"
      )}
      href={STATUS_URL}
      rel="noreferrer"
      target="_blank"
    >
      {isInitialLoad ? (
        <>
          <Spinner />
          <span>Checking Server Status...</span>
        </>
      ) : (
        <>
          <span
            aria-label={systemStatus.label}
            className="relative flex size-2"
            role="status"
          >
            <span
              aria-hidden="true"
              className={cn(
                "absolute inline-flex size-full animate-ping rounded-full opacity-75",
                systemStatus.color,
                isRefreshing && "animate-pulse"
              )}
            />
            <span
              aria-hidden="true"
              className={cn(
                "relative inline-flex size-2 rounded-full",
                systemStatus.color
              )}
            />
          </span>
          <span aria-hidden="true">{systemStatus.label}</span>
        </>
      )}
    </a>
  );
};

export { Status };
