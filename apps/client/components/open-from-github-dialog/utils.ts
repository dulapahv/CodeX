/**
 * Utility functions for GitHub repository path handling.
 * Features:
 * - Display path construction
 * - Tree data item type checking
 * - Path normalization
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  type ExtendedTreeDataItem,
  itemType,
} from "@/components/repo-browser/types/tree";

export const getDisplayPath = (
  repo: string,
  githubUser: string | null,
  branch: string,
  selectedItem: ExtendedTreeDataItem | null,
  fileName: string
) => {
  // Start with repo or githubUser
  let path = repo || githubUser || "";

  if (path) {
    path += "/";
  }

  // Add branch if it exists
  if (branch) {
    path += `${branch}/`;
  }

  // Add directory path from selected item if it exists
  if (selectedItem) {
    if (selectedItem.type === itemType.DIR) {
      path += `${selectedItem.path}/`;
    } else {
      const dirPath = selectedItem.path?.split("/").slice(0, -1).join("/");
      if (dirPath) {
        path += `${dirPath}/`;
      }
    }
  }

  // Add filename
  path += selectedItem?.name === fileName ? selectedItem.name : fileName;

  return path || "No path selected";
};
