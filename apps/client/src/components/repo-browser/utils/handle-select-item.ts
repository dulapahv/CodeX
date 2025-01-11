/**
 * Handle item selection in the GitHub repository browser tree.
 * Functions:
 * - Parent repo/branch lookup
 * - Content fetching
 * - Branch fetching
 * - Tree data recursion
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Dispatch, SetStateAction } from 'react';

import type { TreeDataItem } from '@/components/tree';

import { itemType, type ExtendedTreeDataItem } from '../types/tree';
import { fetchBranches } from './fetch-branches';
import { fetchContents } from './fetch-contents';

// Helper function to find item's parent repo and branch
const findParents = (
  treeData: ExtendedTreeDataItem[],
  itemId: string,
): {
  parentRepo: ExtendedTreeDataItem | undefined;
  parentBranch: ExtendedTreeDataItem | undefined;
} => {
  for (const repo of treeData) {
    if (!repo.children) continue;

    for (const branch of repo.children) {
      // Helper function to recursively search through folder contents
      const findInContents = (items: ExtendedTreeDataItem[]): boolean => {
        for (const item of items) {
          if (item.id === itemId) return true;
          if (item.children && findInContents(item.children)) return true;
        }
        return false;
      };

      // Check if the item exists in this branch's contents
      if (branch.children && findInContents(branch.children)) {
        return { parentRepo: repo, parentBranch: branch };
      }
    }
  }

  return { parentRepo: undefined, parentBranch: undefined };
};

export const handleSelectItem = async (
  item: TreeDataItem,
  treeData: ExtendedTreeDataItem[],
  setSelectedItem: Dispatch<SetStateAction<ExtendedTreeDataItem | null>>,
  setTreeData: Dispatch<SetStateAction<ExtendedTreeDataItem[]>>,
  setItemLoading: (
    itemId: string,
    isLoading: boolean,
    setTreeData: Dispatch<SetStateAction<ExtendedTreeDataItem[]>>,
  ) => void,
  setError: Dispatch<SetStateAction<string>>,
  setRepo: Dispatch<SetStateAction<string>>,
  setBranch: Dispatch<SetStateAction<string>>,
) => {
  const extendedItem = item as ExtendedTreeDataItem;
  setSelectedItem(extendedItem);

  // Reset branch and path when selecting a new repository
  if (extendedItem.type === itemType.REPO) {
    setRepo(extendedItem.full_name || '');
    setBranch('');

    if (!item.children) {
      await fetchBranches(extendedItem, setTreeData, setItemLoading, setError);
    }
  }
  // Update branch when selecting a branch
  else if (extendedItem.type === itemType.BRANCH) {
    setBranch(extendedItem.name);

    if (!item.children) {
      const parentRepo = treeData.find((repo) =>
        repo.children?.some((branch) => branch.id === item.id),
      );
      if (parentRepo) {
        await fetchContents(
          parentRepo,
          extendedItem,
          '',
          setTreeData,
          setItemLoading,
          setError,
        );
      }
    }
  }
  // Update path when selecting a directory or file
  else if (
    (extendedItem.type === itemType.DIR ||
      extendedItem.type === itemType.FILE) &&
    extendedItem.path
  ) {
    if (extendedItem.type === itemType.DIR && !item.children) {
      const { parentRepo, parentBranch } = findParents(treeData, item.id);

      if (parentRepo && parentBranch && extendedItem.path) {
        await fetchContents(
          parentRepo,
          parentBranch,
          extendedItem.path,
          setTreeData,
          setItemLoading,
          setError,
        );
      }
    }
  }
};
