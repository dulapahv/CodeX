/**
 * Transform provider branches into tree structure for repository browser.
 * Features:
 * - Branch data transformation
 * - Tree item icon mapping
 * - Type-safe conversion
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { GitBranch } from "lucide-react";

import type { GitBranch as GitBranchData } from "@/lib/git-providers/types";

import { type ExtendedTreeDataItem, itemType } from "../types/tree";

export const transformBranchesToTreeData = (
  repoID: string,
  branches: GitBranchData[]
): ExtendedTreeDataItem[] =>
  branches.map((branch) => ({
    id: `${repoID}/${branch.name}`,
    name: branch.name,
    children: undefined,
    icon: GitBranch,
    type: itemType.BRANCH,
  }));
