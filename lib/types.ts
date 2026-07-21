export type User = {
  wallet: string;
  name: string;
  createdAt: string;
};

export type Submission = {
  id: string;
  wallet: string;
  name: string;
  track: string;
  week: string;
  zombieUrl: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type SubmissionInput = {
  wallet: string;
  name: string;
  track: string;
  zombieUrl: string;
  note: string;
};

export type PublicSession = {
  wallet: string;
};
