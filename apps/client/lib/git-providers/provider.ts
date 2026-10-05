/**
 * The contract every git hosting adapter implements. Server-only.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { TokenSet } from "./http";
import type {
  CommitInput,
  CommitResult,
  GitBranch,
  GitEntry,
  GitRepo,
  GitUser,
  ProviderId,
} from "./types";

export interface GitProvider {
  authorizeUrl(state: string, redirectUri: string): string;
  commitFile(token: string, input: CommitInput): Promise<CommitResult>;
  exchangeCode(code: string, redirectUri: string): Promise<TokenSet>;
  getUser(token: string): Promise<GitUser>;
  id: ProviderId;
  isConfigured(): boolean;
  label: string;
  listBranches(token: string, repo: string): Promise<GitBranch[]>;
  listDirectory(
    token: string,
    repo: string,
    ref: string,
    path: string
  ): Promise<GitEntry[]>;
  listRepos(token: string, query?: string): Promise<GitRepo[]>;
  readFile(
    token: string,
    repo: string,
    ref: string,
    path: string
  ): Promise<string>;
  refresh(refreshToken: string, redirectUri: string): Promise<TokenSet>;
}
