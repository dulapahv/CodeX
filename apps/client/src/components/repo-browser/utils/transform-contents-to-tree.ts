import { FileCode, Folder } from 'lucide-react';

import type { GithubContent } from '../types/github';
import type { ExtendedTreeDataItem } from '../types/tree';

export const transformContentsToTreeData = (
  repoID: string,
  branchID: string,
  contents: GithubContent[],
): ExtendedTreeDataItem[] => {
  if (!contents) return [];
  return contents
    .filter((item) => item.type === 'DIR' || item.type === 'FILE')
    .map((item) => ({
      id: `${repoID}${branchID}${item.path}`,
      name: item.name,
      path: item.path,
      children: item.type === 'DIR' ? undefined : undefined,
      icon: item.type === 'DIR' ? Folder : FileCode,
      type: item.type,
    }));
};
