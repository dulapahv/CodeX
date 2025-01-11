/**
 * GitHub API utility function for fetching repository branches.
 * Features:
 * - Branch data fetching
 * - Loading state management
 * - Error handling
 * - Tree data transformation
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Dispatch, SetStateAction } from 'react';

import { parseError } from '@/lib/utils';

import type { ExtendedTreeDataItem } from '../types/tree';
import { transformBranchesToTreeData } from './transform-branches-to-tree';

export const fetchBranches = async (
  repo: ExtendedTreeDataItem,
  setTreeData: Dispatch<SetStateAction<ExtendedTreeDataItem[]>>,
  setItemLoading: (
    itemId: string,
    isLoading: boolean,
    setTreeData: Dispatch<SetStateAction<ExtendedTreeDataItem[]>>,
  ) => void,
  setError: Dispatch<SetStateAction<string>>,
) => {
  if (!repo.full_name) return;

  setItemLoading(repo.id, true, setTreeData);
  setError('');
  try {
    const [owner, repoName] = repo.full_name.split('/');
    const response = await fetch(
      `/api/github/repos/branches/${owner}/${repoName}`,
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch branches');
    }

    const branches = await response.json();
    const branchData = transformBranchesToTreeData(repo.id, branches);

    setTreeData((prevData) =>
      prevData.map((item) =>
        item.id === repo.id
          ? { ...item, children: branchData, isLoading: false }
          : item,
      ),
    );
  } catch (err) {
    setError(parseError(err));
    setItemLoading(repo.id, false, setTreeData);
  }
};
