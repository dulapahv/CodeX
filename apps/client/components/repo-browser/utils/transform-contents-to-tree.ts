/**
 * Transform GitHub API content data into tree structure for repository browser.
 * Features:
 * - Directory/file mapping
 * - Icon assignment
 * - Path handling
 * - Type-safe conversion
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { FileCode, Folder } from 'lucide-react';

import type { GithubContent } from '../types/github';
import { itemType, type ExtendedTreeDataItem } from '../types/tree';

export const transformContentsToTreeData = (
  repoID: string,
  branchID: string,
  contents: GithubContent[],
): ExtendedTreeDataItem[] => {
  if (!contents) return [];
  return contents
    .filter((item) => item.type === itemType.DIR || item.type === itemType.FILE)
    .map((item) => ({
      id: `${repoID}${branchID}${item.path}`,
      name: item.name,
      path: item.path,
      children: item.type === itemType.DIR ? undefined : undefined,
      icon: item.type === itemType.DIR ? Folder : FileCode,
      type: item.type,
    }));
};
