/**
 * Transform provider repositories into tree structure for repository browser.
 * Features:
 * - Repository data transformation
 * - Icon assignment
 * - Type-safe conversion
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { FolderIcon } from "@phosphor-icons/react";

import type { GitRepo } from "@/lib/git-providers/types";

import { type ExtendedTreeDataItem, itemType } from "../types/tree";

export const transformReposToTreeData = (
  repos: GitRepo[]
): ExtendedTreeDataItem[] =>
  repos.map((repo) => ({
    children: undefined,
    fullName: repo.fullName,
    icon: FolderIcon,
    id: repo.id,
    name: repo.name,
    type: itemType.REPO,
  }));
