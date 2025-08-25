/**
 * Transform GitHub API repository data into tree structure for repository browser.
 * Features:
 * - Repository data transformation
 * - Icon assignment
 * - Type-safe conversion
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Folder } from 'lucide-react';

import type { GithubRepo } from '../types/github';
import { itemType, type ExtendedTreeDataItem } from '../types/tree';

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
    type: itemType.REPO,
  }));
};
