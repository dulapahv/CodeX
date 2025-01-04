import { GitBranch } from 'lucide-react';

import type { GithubBranch } from '../types/github';
import type { ExtendedTreeDataItem } from '../types/tree';

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
    type: 'BRANCH',
  }));
};
