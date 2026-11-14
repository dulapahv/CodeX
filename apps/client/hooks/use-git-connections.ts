/**
 * Connection state for every git provider: who is signed in, which providers
 * are configured, and connect/disconnect actions.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";

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

// A provider is missing until its first check answers
export type KnownConnections = Partial<GitConnections>;

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

// Kept for the whole visit, so reopening a dialog shows the last known state
// right away while it checks again
let known: KnownConnections = {};
const NONE: KnownConnections = {};
const listeners = new Set<() => void>();
const pending = new Map<ProviderId, Promise<void>>();

const setConnection = (provider: ProviderId, connection: GitConnection) => {
  known = { ...known, [provider]: connection };
  for (const listener of listeners) {
    listener();
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const load = (provider: ProviderId, isFresh = false) => {
  const inFlight = pending.get(provider);
  if (inFlight && !isFresh) {
    return inFlight;
  }
  const request = fetchConnection(provider)
    .then((connection) => setConnection(provider, connection))
    .finally(() => {
      if (pending.get(provider) === request) {
        pending.delete(provider);
      }
    });
  pending.set(provider, request);
  return request;
};

export const useGitConnections = (isActive: boolean) => {
  const connections = useSyncExternalStore(
    subscribe,
    () => known,
    () => NONE
  );

  useEffect(() => {
    if (isActive) {
      for (const provider of PROVIDER_IDS) {
        load(provider);
      }
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      const provider = getConnectedProvider(event);
      if (provider) {
        window.authWindow?.close();
        load(provider, true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isActive]);

  const disconnect = useCallback(async (provider: ProviderId) => {
    const response = await fetch(`/api/${provider}/auth`, {
      credentials: "include",
      method: "DELETE",
    });
    if (response.ok) {
      setConnection(provider, { configured: true, user: null });
    }
  }, []);

  return { connect: connectProvider, connections, disconnect };
};
