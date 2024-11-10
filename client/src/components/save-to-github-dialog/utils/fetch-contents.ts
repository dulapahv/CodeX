import { Dispatch, SetStateAction } from 'react';

import { parseError } from '@/lib/utils';

import type { ExtendedTreeDataItem } from '../types/tree';
import { transformContentsToTreeData } from './transform-contents-to-tree';

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

  setItemLoading(branch.id, true, setTreeData);
  setError('');
  try {
    const [owner, repoName] = repo.full_name.split('/');
    const response = await fetch(
      `/api/oauth/repos/github/contents/${owner}/${repoName}?path=${encodeURIComponent(
        path,
      )}&ref=${encodeURIComponent(branch.name)}`,
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch contents');
    }

    const contents = await response.json();
    const contentData = transformContentsToTreeData(contents);

    setTreeData((prevData) => {
      return prevData.map((repoItem) => {
        if (repoItem.id === repo.id) {
          return {
            ...repoItem,
            children: repoItem.children?.map((branchItem) => {
              if (branchItem.id === branch.id) {
                return {
                  ...branchItem,
                  children: contentData,
                  isLoading: false,
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
    setItemLoading(branch.id, false, setTreeData);
  }
};
