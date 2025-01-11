/**
 * GitHub API utility function for merging repository folder contents.
 * Features:
 * - Recursive content merging
 * - Path-based matching
 * - Tree data transformation
 * - State updating
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Dispatch, SetStateAction } from 'react';

import { parseError } from '@/lib/utils';

import type { ExtendedTreeDataItem } from '../types/tree';
import { transformContentsToTreeData } from './transform-contents-to-tree';

const mergeFolderContents = (
  existingChildren: ExtendedTreeDataItem[] | undefined,
  newContents: ExtendedTreeDataItem[],
  currentPath: string,
): ExtendedTreeDataItem[] => {
  if (!existingChildren) return newContents;

  // Create a map of new contents for faster lookup
  const newContentsMap = new Map(newContents.map((item) => [item.id, item]));

  // Helper function to update children recursively
  const updateChildrenRecursively = (
    items: ExtendedTreeDataItem[],
    targetPath: string,
  ): ExtendedTreeDataItem[] => {
    return items.map((item) => {
      // If this is the target folder, update its children
      if (item.path === targetPath) {
        return {
          ...item,
          children: newContents,
        };
      }

      // If this item is in the new contents, update it
      if (newContentsMap.has(item.id)) {
        return {
          ...item,
          ...newContentsMap.get(item.id),
        };
      }

      // If this item has children and the target path is nested under it,
      // recursively update its children
      if (
        item.children &&
        item.path &&
        targetPath.startsWith(item.path + '/')
      ) {
        return {
          ...item,
          children: updateChildrenRecursively(item.children, targetPath),
        };
      }

      // Otherwise, keep the item as is
      return item;
    });
  };

  return updateChildrenRecursively(existingChildren, currentPath);
};

export const fetchContents = async (
  repo: ExtendedTreeDataItem,
  branch: ExtendedTreeDataItem,
  path: string = '',
  setTreeData: Dispatch<SetStateAction<ExtendedTreeDataItem[]>>,
  setItemLoading: (
    itemId: string,
    isLoading: boolean,
    setTreeData: Dispatch<SetStateAction<ExtendedTreeDataItem[]>>,
  ) => void,
  setError: Dispatch<SetStateAction<string>>,
) => {
  if (!repo.full_name) return;

  // Find the ID of the folder being expanded
  const getFolderIdFromPath = (
    items: ExtendedTreeDataItem[],
    targetPath: string,
  ): string | undefined => {
    for (const item of items) {
      if (item.path === targetPath) {
        return item.id;
      }
      if (item.children) {
        const foundId = getFolderIdFromPath(item.children, targetPath);
        if (foundId) return foundId;
      }
    }
    return undefined;
  };

  // If there's a path, find the corresponding folder's ID
  let targetId = branch.id;
  if (path) {
    const folderId = getFolderIdFromPath(branch.children || [], path);
    if (folderId) {
      targetId = folderId;
    }
  }

  setItemLoading(targetId, true, setTreeData);
  setError('');

  try {
    const [owner, repoName] = repo.full_name.split('/');
    const response = await fetch(
      `/api/github/repos/contents/${owner}/${repoName}?path=${encodeURIComponent(
        path,
      )}&ref=${encodeURIComponent(branch.name)}`,
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch contents');
    }

    const contents = await response.json();
    const contentData = transformContentsToTreeData(
      repo.id,
      branch.id,
      contents,
    );

    setTreeData((prevData) => {
      return prevData.map((repoItem) => {
        if (repoItem.id === repo.id) {
          return {
            ...repoItem,
            children: repoItem.children?.map((branchItem) => {
              if (branchItem.id === branch.id) {
                const mergedChildren = mergeFolderContents(
                  branchItem.children,
                  contentData,
                  path,
                );

                return {
                  ...branchItem,
                  children: mergedChildren,
                };
              }
              return branchItem;
            }),
          };
        }
        return repoItem;
      });
    });
  } catch (err) {
    setError(parseError(err));
  } finally {
    setItemLoading(targetId, false, setTreeData);
  }
};
