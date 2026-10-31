/**
 * Transform provider branches into tree structure for repository browser.
 * Features:
 * - Branch data transformation
 * - Tree item icon mapping
 * - Type-safe conversion
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { GitBranchIcon } from "@phosphor-icons/react";

import type { GitBranch as GitBranchData } from "@/lib/git-providers/types";

import { type ExtendedTreeDataItem, itemType } from "../types/tree";

export const transformBranchesToTreeData = (
  repoID: string,
  branches: GitBranchData[]
): ExtendedTreeDataItem[] =>
  branches.map((branch) => ({
    children: undefined,
    icon: GitBranchIcon,
    id: `${repoID}/${branch.name}`,
    name: branch.name,
    type: itemType.BRANCH,
  }));
