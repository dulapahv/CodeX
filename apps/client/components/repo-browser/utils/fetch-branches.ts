/**
 * Fetches a repository's branches from a git provider.
 * Features:
 * - Branch data fetching
 * - Loading state management
 * - Error handling
 * - Tree data transformation
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Dispatch, SetStateAction } from "react";

import { requestJson } from "@/components/shared/git/utils/request";
import type { GitBranch, ProviderId } from "@/lib/git-providers/types";
import { parseError } from "@/lib/utils";

import type { ExtendedTreeDataItem } from "../types/tree";
import { transformBranchesToTreeData } from "./transform-branches-to-tree";

export const fetchBranches = async (
  provider: ProviderId,
  repo: ExtendedTreeDataItem,
  setTreeData: Dispatch<SetStateAction<ExtendedTreeDataItem[]>>,
  setItemLoading: (
    itemId: string,
    isLoading: boolean,
    setTreeData: Dispatch<SetStateAction<ExtendedTreeDataItem[]>>
  ) => void,
  setError: Dispatch<SetStateAction<string>>
) => {
  if (!repo.fullName) {
    return;
  }

  setItemLoading(repo.id, true, setTreeData);
  setError("");
  try {
    const branches = await requestJson<GitBranch[]>(
      `/api/${provider}/branches?${new URLSearchParams({ repo: repo.fullName })}`
    );
    const branchData = transformBranchesToTreeData(repo.id, branches);

    setTreeData((prevData) =>
      prevData.map((item) =>
        item.id === repo.id
          ? { ...item, children: branchData, isLoading: false }
          : item
      )
    );
  } catch (err) {
    setError(parseError(err));
    setItemLoading(repo.id, false, setTreeData);
  }
};
