/**
 * Shared types for the git hosting providers (GitHub, GitLab, Bitbucket,
 * Codeberg). Safe to import from client code.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

export const PROVIDER_IDS = [
  "github",
  "gitlab",
  "bitbucket",
  "codeberg",
] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  bitbucket: "Bitbucket",
  codeberg: "Codeberg",
  github: "GitHub",
  gitlab: "GitLab",
};

export const isProviderId = (value: string): value is ProviderId =>
  (PROVIDER_IDS as readonly string[]).includes(value);

export interface GitUser {
  avatarUrl: string | null;
  username: string;
}

export interface GitRepo {
  fullName: string;
  id: string;
  name: string;
}

export interface GitBranch {
  name: string;
}

export interface GitEntry {
  name: string;
  path: string;
  type: "file" | "dir";
}

export interface CommitInput {
  branch: string;
  content: string;
  message: string;
  path: string;
  repo: string;
}

export interface CommitResult {
  url: string;
}
