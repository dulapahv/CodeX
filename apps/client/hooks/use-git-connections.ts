/**
 * Connection state for every git provider: who is signed in, which providers
 * are configured, and connect/disconnect actions.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useCallback, useEffect, useState } from "react";

import {
  type GitUser,
  PROVIDER_IDS,
  type ProviderId,
} from "@/lib/git-providers/types";
import { connectProvider, getConnectedProvider } from "@/lib/utils";

export interface GitConnection {
  configured: boolean;
  user: GitUser | null;
}

export type GitConnections = Record<ProviderId, GitConnection>;

const fetchConnection = async (
  provider: ProviderId
): Promise<GitConnection> => {
  try {
    const response = await fetch(`/api/${provider}/auth`, {
      credentials: "include",
    });
    if (response.status === 503) {
      return { configured: false, user: null };
    }
    const user = response.ok ? ((await response.json()) as GitUser) : null;
    return { configured: true, user };
  } catch {
    return { configured: true, user: null };
  }
};

export const useGitConnections = (isActive: boolean) => {
  const [connections, setConnections] = useState<GitConnections | null>(null);

  const refresh = useCallback(
    async (providers: readonly ProviderId[] = PROVIDER_IDS) => {
      const results = await Promise.all(providers.map(fetchConnection));
      setConnections((previous) => {
        const next = { ...previous } as GitConnections;
        for (const [index, provider] of providers.entries()) {
          next[provider] = results[index];
        }
        return next;
      });
    },
    []
  );

  useEffect(() => {
    if (isActive) {
      refresh();
    }
  }, [isActive, refresh]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      const provider = getConnectedProvider(event);
      if (provider) {
        window.authWindow?.close();
        refresh([provider]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isActive, refresh]);

  const disconnect = useCallback(async (provider: ProviderId) => {
    const response = await fetch(`/api/${provider}/auth`, {
      method: "DELETE",
      credentials: "include",
    });
    if (response.ok) {
      setConnections((previous) =>
        previous
          ? { ...previous, [provider]: { configured: true, user: null } }
          : previous
      );
    }
  }, []);

  return {
    connections,
    isLoading: connections === null,
    connect: connectProvider,
    disconnect,
  };
};
