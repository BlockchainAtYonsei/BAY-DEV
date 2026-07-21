// data/*.json(파일 스토어 시절 데이터)을 SQLite로 1회 이전하는 스크립트
// 사용법: node scripts/import-json.mjs
import { PrismaClient } from "@prisma/client";
import { readFile } from "fs/promises";

const prisma = new PrismaClient();

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return [];
  }
}

const users = await readJson("data/users.json");
for (const user of users) {
  await prisma.user.upsert({
    where: { wallet: user.wallet.toLowerCase() },
    update: {},
    create: {
      wallet: user.wallet.toLowerCase(),
      name: user.name,
      createdAt: new Date(user.createdAt)
    }
  });
}
console.log(`users imported: ${users.length}`);

const submissions = await readJson("data/submissions.json");
for (const s of submissions) {
  await prisma.submission.upsert({
    where: {
      wallet_track_week: {
        wallet: s.wallet.toLowerCase(),
        track: s.track || "cryptozombies",
        week: s.week
      }
    },
    update: {},
    create: {
      id: s.id,
      wallet: s.wallet.toLowerCase(),
      name: s.name,
      track: s.track || "cryptozombies",
      week: s.week,
      zombieUrl: s.zombieUrl,
      note: s.note || "",
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt)
    }
  });
}
console.log(`submissions imported: ${submissions.length}`);

await prisma.$disconnect();
