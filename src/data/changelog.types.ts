export type ChangelogEntry = {
  sha: string;
  shortSha: string;
  date: string;
  type: "feat" | "fix";
  scope: string | null;
  subject: string;
  githubUrl: string;
};

export type Changelog = ChangelogEntry[];
