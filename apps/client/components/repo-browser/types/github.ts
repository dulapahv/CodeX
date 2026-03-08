/**
 * Type definitions for GitHub API response data.
 * Includes:
 * - Repository information
 * - Branch data
 * - Content metadata
 * - Commit response
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { itemType } from "./tree";

export interface GithubRepo {
  full_name: string;
  id: number;
  name: string;
}

export interface GithubBranch {
  name: string;
}

export interface GithubContent {
  name: string;
  path: string;
  type: itemType.DIR | itemType.FILE;
}

export interface CommitResponse {
  content: {
    html_url: string;
    sha: string;
  };
}
