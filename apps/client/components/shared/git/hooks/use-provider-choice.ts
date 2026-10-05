/**
 * Which provider a repository dialog shows: the user's pick, else the last
 * one used, else the first connected one, else GitHub.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useCallback, useEffect, useState } from "react";

import {
  type GitConnections,
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

const getPreferredProvider = (connections: GitConnections | null) =>
  readLastProvider() ??
  PROVIDER_IDS.find((provider) => connections?.[provider]?.user) ??
  "github";

export const useProviderChoice = (isOpen: boolean) => {
  const { connections, isLoading } = useGitConnections(isOpen);
  const [chosen, setChosen] = useState<ProviderId | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setChosen(null);
    }
  }, [isOpen]);

  const choose = useCallback((provider: ProviderId) => {
    setChosen(provider);
    rememberProvider(provider);
  }, []);

  const provider = chosen ?? getPreferredProvider(connections);
  const connection = connections?.[provider];

  return {
    connections,
    isLoading,
    provider,
    choose,
    user: connection?.user ?? null,
    configured: connection?.configured ?? true,
  };
};
