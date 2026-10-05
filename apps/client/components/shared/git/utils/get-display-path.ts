/**
 * Builds the "owner/repo/branch/folder/file" path shown under the repository
 * dialogs.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  type ExtendedTreeDataItem,
  itemType,
} from "@/components/repo-browser/types/tree";

export const getDisplayPath = (
  repo: string,
  username: string | null,
  branch: string,
  selectedItem: ExtendedTreeDataItem | null,
  fileName: string
) => {
  let path = repo || username || "";

  if (path) {
    path += "/";
  }

  if (branch) {
    path += `${branch}/`;
  }

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

  path += selectedItem?.name === fileName ? selectedItem.name : fileName;

  return path || "No path selected";
};
