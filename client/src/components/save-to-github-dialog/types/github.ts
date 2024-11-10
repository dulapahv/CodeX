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
  type: 'dir' | 'file';
};

export type CommitForm = {
  fileName: string;
  commitSummary: string;
  extendedDescription?: string;
};
