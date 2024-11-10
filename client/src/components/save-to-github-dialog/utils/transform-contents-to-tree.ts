import { FileCode, Folder } from 'lucide-react';

import type { GithubContent } from '../types/github';
import type { ExtendedTreeDataItem } from '../types/tree';

export function transformContentsToTreeData(
  contents: GithubContent[],
): ExtendedTreeDataItem[] {
  if (!contents) return [];
  return contents
    .filter((item) => item.type === 'dir' || item.type === 'file')
    .map((item) => ({
      id: `content-${item.path}`,
      name: item.name,
      path: item.path,
      children: item.type === 'dir' ? undefined : undefined,
      icon: item.type === 'dir' ? Folder : FileCode,
      type: item.type,
    }));
}
