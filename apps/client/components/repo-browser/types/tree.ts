/**
 * Type definitions for GitHub repository tree data structures.
 * Includes:
 * - Item type enums
 * - Extended tree item interface
 * - Repository structure types
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { TreeDataItem } from '@/components/tree';

export enum itemType {
  REPO = 'repo',
  BRANCH = 'branch',
  DIR = 'dir',
  FILE = 'file',
}

// Extended interface for GitHub-specific functionality
export interface ExtendedTreeDataItem extends TreeDataItem {
  full_name?: string;
  path?: string;
  type?: itemType;
  children?: ExtendedTreeDataItem[]; // Override children type
}
