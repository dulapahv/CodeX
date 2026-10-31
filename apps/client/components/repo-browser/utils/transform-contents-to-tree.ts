/**
 * Transform a provider folder listing into tree structure for repository browser.
 * Features:
 * - Directory/file mapping
 * - Icon assignment
 * - Path handling
 * - Type-safe conversion
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { FileCodeIcon, FolderIcon } from "@phosphor-icons/react";

import type { GitEntry } from "@/lib/git-providers/types";

import { type ExtendedTreeDataItem, itemType } from "../types/tree";

export const transformContentsToTreeData = (
  branchID: string,
  entries: GitEntry[]
): ExtendedTreeDataItem[] =>
  entries.map((entry) => ({
    icon: entry.type === "dir" ? FolderIcon : FileCodeIcon,
    id: `${branchID}:${entry.path}`,
    name: entry.name,
    path: entry.path,
    type: entry.type === "dir" ? itemType.DIR : itemType.FILE,
  }));
