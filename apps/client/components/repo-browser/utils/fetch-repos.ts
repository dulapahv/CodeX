/**
 * Fetches the user's repositories from a git provider.
 * Features:
 * - Repository search functionality
 * - Loading state management
 * - Error handling
 * - Tree data transformation
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Dispatch, SetStateAction } from "react";

import { requestJson } from "@/components/shared/git/utils/request";
import type { GitRepo, ProviderId } from "@/lib/git-providers/types";
import { parseError } from "@/lib/utils";

import type { ExtendedTreeDataItem } from "../types/tree";
import { transformReposToTreeData } from "./transform-repos-to-tree";

export const fetchRepos = async (
  provider: ProviderId,
  setLoading: Dispatch<SetStateAction<boolean>>,
  setError: Dispatch<SetStateAction<string>>,
  setTreeData: Dispatch<SetStateAction<ExtendedTreeDataItem[]>>,
  query?: string
) => {
  const params = new URLSearchParams();
  if (query?.trim()) {
    params.set("q", query.trim());
  }

  setLoading(true);
  setError("");
  try {
    const repos = await requestJson<GitRepo[]>(
      `/api/${provider}/repos?${params}`
    );
    setTreeData(transformReposToTreeData(repos));
  } catch (err) {
    setError(parseError(err));
  } finally {
    setLoading(false);
  }
};
