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
  itemType,
  type ExtendedTreeDataItem,
} from '@/components/repo-browser/types/tree';

export const getDisplayPath = (
  repo: string,
  githubUser: string,
  branch: string,
  selectedItem: ExtendedTreeDataItem | null,
  fileName: string,
) => {
  // Start with repo or githubUser
  let path = repo || githubUser;

  path += '/';

  // Add branch if it exists
  if (branch) {
    path += `${branch}/`;
  }

  // Add directory path from selected item if it exists
  if (selectedItem) {
    if (selectedItem.type === itemType.DIR) {
      path += `${selectedItem.path}/`;
    } else {
      const dirPath = selectedItem.path?.split('/').slice(0, -1).join('/');
      if (dirPath) {
        path += `${dirPath}/`;
      }
    }
  }

  // Add filename
  path += selectedItem?.name === fileName ? selectedItem.name : fileName;

  return path;
};
