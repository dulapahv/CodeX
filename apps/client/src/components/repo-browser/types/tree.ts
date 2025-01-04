import type { TreeDataItem } from '@/components/tree';

// Extended interface for GitHub-specific functionality
export interface ExtendedTreeDataItem extends Omit<TreeDataItem, 'type'> {
  full_name?: string;
  path?: string;
  type?: 'REPO' | 'BRANCH' | 'DIR' | 'FILE';
  children?: ExtendedTreeDataItem[]; // Override children type
}
