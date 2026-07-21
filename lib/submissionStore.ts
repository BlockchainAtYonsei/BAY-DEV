import { prisma } from "./db";
import type { Submission, SubmissionInput } from "./types";

export interface SubmissionStore {
  list(): Promise<Submission[]>;
  listByWallet(wallet: string): Promise<Submission[]>;
  upsertByWalletAndWeek(input: SubmissionInput, week: string): Promise<Submission>;
}

type SubmissionRow = {
  id: string;
  wallet: string;
  name: string;
  track: string;
  week: string;
  zombieUrl: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
};

function toSubmission(row: SubmissionRow): Submission {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

class PrismaSubmissionStore implements SubmissionStore {
  async list() {
    const rows = await prisma.submission.findMany({
      orderBy: { updatedAt: "desc" }
    });
    return rows.map(toSubmission);
  }

  async listByWallet(wallet: string) {
    const rows = await prisma.submission.findMany({
      where: { wallet: wallet.toLowerCase() },
      orderBy: [{ track: "asc" }, { week: "desc" }]
    });
    return rows.map(toSubmission);
  }

  async upsertByWalletAndWeek(input: SubmissionInput, week: string) {
    const wallet = input.wallet.toLowerCase();
    const data = {
      name: input.name.trim(),
      zombieUrl: input.zombieUrl.trim(),
      note: input.note.trim()
    };
    const row = await prisma.submission.upsert({
      where: { wallet_track_week: { wallet, track: input.track, week } },
      update: data,
      create: { ...data, wallet, track: input.track, week }
    });
    return toSubmission(row);
  }
}

export const submissionStore: SubmissionStore = new PrismaSubmissionStore();
