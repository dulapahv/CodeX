import type { Dispatch, SetStateAction } from 'react';

import type { ExtendedTreeDataItem } from '../types/tree';

export const setItemLoading = (
  itemId: string,
  isLoading: boolean,
  setTreeData: Dispatch<SetStateAction<ExtendedTreeDataItem[]>>,
) => {
  setTreeData((prevData) => {
    const updateChildren = (
      items: ExtendedTreeDataItem[],
    ): ExtendedTreeDataItem[] => {
      return items.map((item) => {
        if (item.id === itemId) {
          return { ...item, isLoading };
        }
        if (item.children) {
          const extendedChildren = item.children;
          return {
            ...item,
            children: updateChildren(extendedChildren),
          };
        }
        return item;
      });
    };
    return updateChildren(prevData);
  });
};
