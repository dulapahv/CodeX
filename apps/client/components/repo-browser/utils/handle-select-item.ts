/**
 * Handle item selection in the repository browser tree.
 * Functions:
 * - Parent repo/branch lookup
 * - Content fetching
 * - Branch fetching
 * - Tree data recursion
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Dispatch, SetStateAction } from "react";

import type { TreeDataItem } from "@/components/tree";
import type { ProviderId } from "@/lib/git-providers/types";

import { type ExtendedTreeDataItem, itemType } from "../types/tree";
import { fetchBranches } from "./fetch-branches";
import { fetchContents } from "./fetch-contents";

// Helper function to find item's parent repo and branch
const findParents = (
  treeData: ExtendedTreeDataItem[],
  itemId: string
): {
  parentRepo: ExtendedTreeDataItem | undefined;
  parentBranch: ExtendedTreeDataItem | undefined;
} => {
  for (const repo of treeData) {
    if (!repo.children) {
      continue;
    }

    for (const branch of repo.children) {
      // Helper function to recursively search through folder contents
      const findInContents = (items: ExtendedTreeDataItem[]): boolean => {
        for (const item of items) {
          if (item.id === itemId) {
            return true;
          }
          if (item.children && findInContents(item.children)) {
            return true;
          }
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
  provider: ProviderId,
  item: TreeDataItem,
  treeData: ExtendedTreeDataItem[],
  setSelectedItem: Dispatch<SetStateAction<ExtendedTreeDataItem | null>>,
  setTreeData: Dispatch<SetStateAction<ExtendedTreeDataItem[]>>,
  setItemLoading: (
    itemId: string,
    isLoading: boolean,
    setTreeData: Dispatch<SetStateAction<ExtendedTreeDataItem[]>>
  ) => void,
  setError: Dispatch<SetStateAction<string>>,
  setRepo: Dispatch<SetStateAction<string>>,
  setBranch: Dispatch<SetStateAction<string>>
) => {
  const extendedItem = item as ExtendedTreeDataItem;
  setSelectedItem(extendedItem);

  // Reset branch and path when selecting a new repository
  if (extendedItem.type === itemType.REPO) {
    setRepo(extendedItem.fullName || "");
    setBranch("");

    if (!item.children) {
      await fetchBranches(
        provider,
        extendedItem,
        setTreeData,
        setItemLoading,
        setError
      );
    }
    return;
  }

  if (extendedItem.type === itemType.BRANCH) {
    const parentRepo = treeData.find((repo) =>
      repo.children?.some((branch) => branch.id === item.id)
    );
    setRepo(parentRepo?.fullName || "");
    setBranch(extendedItem.name);

    if (parentRepo && !item.children) {
      await fetchContents(
        provider,
        parentRepo,
        extendedItem,
        "",
        setTreeData,
        setItemLoading,
        setError
      );
    }
    return;
  }

  // A folder or file: target the repo and branch it actually belongs to
  const { parentRepo, parentBranch } = findParents(treeData, item.id);
  setRepo(parentRepo?.fullName || "");
  setBranch(parentBranch?.name || "");

  const isUnloadedFolder =
    extendedItem.type === itemType.DIR && extendedItem.path && !item.children;
  if (parentRepo && parentBranch && isUnloadedFolder && extendedItem.path) {
    await fetchContents(
      provider,
      parentRepo,
      parentBranch,
      extendedItem.path,
      setTreeData,
      setItemLoading,
      setError
    );
  }
};
