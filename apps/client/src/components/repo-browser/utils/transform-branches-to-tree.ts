/**
 * Transform GitHub branch data into tree structure for repository browser.
 * Features:
 * - Branch data transformation
 * - Tree item icon mapping
 * - Type-safe conversion
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { GitBranch } from 'lucide-react';

import type { GithubBranch } from '../types/github';
import { itemType, type ExtendedTreeDataItem } from '../types/tree';

export const transformBranchesToTreeData = (
  repoID: string,
  branches: GithubBranch[],
): ExtendedTreeDataItem[] => {
  if (!branches) return [];
  return branches.map((branch) => ({
    id: `${repoID}${branch.name}`,
    name: branch.name,
    children: undefined,
    icon: GitBranch,
    type: itemType.BRANCH,
  }));
};
