import { Dispatch, SetStateAction } from 'react';

import type { TreeDataItem } from '@/components/tree';

import { itemType, type ExtendedTreeDataItem } from '../types/tree';
import { fetchBranches } from './fetch-branches';
import { fetchContents } from './fetch-contents';

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
) => {
  const extendedItem = item as ExtendedTreeDataItem;
  setSelectedItem(extendedItem);

  if (extendedItem.type === itemType.REPO && !item.children) {
    await fetchBranches(extendedItem, setTreeData, setItemLoading, setError);
  } else if (extendedItem.type === itemType.BRANCH && !item.children) {
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
  } else if (extendedItem.type === itemType.DIR && !item.children) {
    const parentRepo = treeData.find((repo) =>
      repo.children?.some((branch) =>
        branch.children?.some((content) => content.id === item.id),
      ),
    );
    const parentBranch = parentRepo?.children?.find((branch) =>
      branch.children?.some((content) => content.id === item.id),
    );

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
};
