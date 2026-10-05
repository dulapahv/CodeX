/**
 * Transform provider repositories into tree structure for repository browser.
 * Features:
 * - Repository data transformation
 * - Icon assignment
 * - Type-safe conversion
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Folder } from "lucide-react";

import type { GitRepo } from "@/lib/git-providers/types";

import { type ExtendedTreeDataItem, itemType } from "../types/tree";

export const transformReposToTreeData = (
  repos: GitRepo[]
): ExtendedTreeDataItem[] =>
  repos.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.fullName,
    children: undefined,
    icon: Folder,
    type: itemType.REPO,
  }));
