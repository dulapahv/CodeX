import { type TreeDataItem } from '@/components/tree';

// Extended interface for GitHub-specific functionality
export interface ExtendedTreeDataItem extends Omit<TreeDataItem, 'type'> {
  full_name?: string;
  path?: string;
  type?: 'repo' | 'branch' | 'dir' | 'file';
  children?: ExtendedTreeDataItem[]; // Override children type
}
