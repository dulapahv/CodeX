import { Folder } from 'lucide-react';

import type { GithubRepo } from '../types/github';
import type { ExtendedTreeDataItem } from '../types/tree';

export const transformReposToTreeData = (
  repos: GithubRepo[],
): ExtendedTreeDataItem[] => {
  if (!repos) return [];
  return repos.map((repo) => ({
    id: repo.id.toString(),
    name: repo.name,
    full_name: repo.full_name,
    children: undefined,
    icon: Folder,
    type: 'REPO',
  }));
};
