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
  type: 'DIR' | 'FILE';
};

export type CommitResponse = {
  content: {
    html_url: string;
    sha: string;
  };
};
