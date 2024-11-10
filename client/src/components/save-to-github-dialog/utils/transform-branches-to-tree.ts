import { GitBranch } from 'lucide-react';

import type { GithubBranch } from '../types/github';
import type { ExtendedTreeDataItem } from '../types/tree';

export function transformBranchesToTreeData(
  branches: GithubBranch[],
): ExtendedTreeDataItem[] {
  if (!branches) return [];
  return branches.map((branch) => ({
    id: `branch-${branch.name}`,
    name: branch.name,
    children: undefined,
    icon: GitBranch,
    type: 'branch',
  }));
}
