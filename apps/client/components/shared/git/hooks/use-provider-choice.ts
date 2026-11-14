/**
 * Which provider a repository dialog shows: the user's pick, else the last
 * one used, else the first connected one, else GitHub.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useCallback, useEffect, useState } from "react";

import {
  type KnownConnections,
  useGitConnections,
} from "@/hooks/use-git-connections";
import {
  isProviderId,
  PROVIDER_IDS,
  type ProviderId,
} from "@/lib/git-providers/types";

const LAST_PROVIDER_KEY = "codex-git-provider";

const readLastProvider = (): ProviderId | null => {
  try {
    const saved = localStorage.getItem(LAST_PROVIDER_KEY);
    return saved && isProviderId(saved) ? saved : null;
  } catch {
    return null;
  }
};

const rememberProvider = (provider: ProviderId) => {
  try {
    localStorage.setItem(LAST_PROVIDER_KEY, provider);
  } catch {
    // Storage can be unavailable (private mode); the choice just isn't kept
  }
};

// Waits only on the providers that decide it, so a slow one further down the
// list doesn't hold the dialog up
const getPreferredProvider = (
  connections: KnownConnections
): ProviderId | null => {
  const lastProvider = readLastProvider();
  if (lastProvider) {
    return lastProvider;
  }
  for (const provider of PROVIDER_IDS) {
    const connection = connections[provider];
    if (!connection) {
      return null;
    }
    if (connection.user) {
      return provider;
    }
  }
  return "github";
};

export const useProviderChoice = (isOpen: boolean) => {
  const { connections } = useGitConnections(isOpen);
  const [chosen, setChosen] = useState<ProviderId | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setChosen(null);
    }
  }, [isOpen]);

  const choose = useCallback((providerId: ProviderId) => {
    setChosen(providerId);
    rememberProvider(providerId);
  }, []);

  const preferred = chosen ?? getPreferredProvider(connections);
  const provider = preferred ?? "github";
  const connection = connections[provider];

  return {
    choose,
    configured: connection?.configured ?? true,
    connections,
    isLoading: preferred === null || connection === undefined,
    provider,
    user: connection?.user ?? null,
  };
};
