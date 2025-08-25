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

import { itemType } from './tree';

export type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
};

export type GithubBranch = {
  name: string;
};

export type GithubContent = {
  name: string;
  path: string;
  type: itemType.DIR | itemType.FILE;
};

export type CommitResponse = {
  content: {
    html_url: string;
    sha: string;
  };
};
