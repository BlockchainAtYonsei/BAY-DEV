import { prisma } from "./db";
import type { User } from "./types";

export interface UserStore {
  findByWallet(wallet: string): Promise<User | null>;
  create(wallet: string, name: string): Promise<User>;
}

type UserRow = {
  wallet: string;
  name: string;
  createdAt: Date;
};

function toUser(row: UserRow): User {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

class PrismaUserStore implements UserStore {
  async findByWallet(wallet: string) {
    const row = await prisma.user.findUnique({
      where: { wallet: wallet.toLowerCase() }
    });
    return row ? toUser(row) : null;
  }

  async create(wallet: string, name: string) {
    const key = wallet.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { wallet: key } });
    if (existing) return toUser(existing);

    const row = await prisma.user.create({
      data: { wallet: key, name: name.trim() }
    });
    return toUser(row);
  }
}

export const userStore: UserStore = new PrismaUserStore();
