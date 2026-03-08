/**
 * Custom hook for managing GitHub authentication state.
 * Handles OAuth flow and user authentication checks.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useEffect, useLayoutEffect, useState } from "react";

export const useGithubAuth = (isOpen: boolean) => {
  const [githubUser, setGithubUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useLayoutEffect(() => {
    if (isOpen) {
      fetch("/api/github/auth", {
        credentials: "include",
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setGithubUser(data?.username ?? null))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === "github-oauth" && event.data.success) {
        const response = await fetch("/api/github/auth", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setGithubUser(data.username);
        }
        window.authWindow?.close();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return { githubUser, isLoading };
};
