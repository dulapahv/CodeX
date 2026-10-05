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

import { FileCode, Folder } from "lucide-react";

import type { GitEntry } from "@/lib/git-providers/types";

import { type ExtendedTreeDataItem, itemType } from "../types/tree";

export const transformContentsToTreeData = (
  branchID: string,
  entries: GitEntry[]
): ExtendedTreeDataItem[] =>
  entries.map((entry) => ({
    id: `${branchID}:${entry.path}`,
    name: entry.name,
    path: entry.path,
    icon: entry.type === "dir" ? Folder : FileCode,
    type: entry.type === "dir" ? itemType.DIR : itemType.FILE,
  }));
