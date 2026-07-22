// 로컬 데모용 시드: 퀴즈 1개 + 테스트 유저/댓글
// 사용법: node scripts/seed-community.mjs
import { PrismaClient } from "@prisma/client";
import { readFile } from "fs/promises";

const prisma = new PrismaClient();

const ADMIN = "0x1111111111111111111111111111111111111111";
const ALICE = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const BOB = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

const markdown = await readFile("quizzes/week1-review.md", "utf8");

const quiz = await prisma.quiz.upsert({
  where: { slug: "week1-review" },
  update: { markdown, published: true },
  create: {
    slug: "week1-review",
    title: "1회차 복습 퀴즈 — 이더리움 네트워크 큰 그림",
    badge: "퀴즈 과제",
    track: "ethereum-core",
    markdown,
    published: true
  }
});

for (const [wallet, name] of [
  [ADMIN, "서버장"],
  [ALICE, "김앨리스"],
  [BOB, "이밥"]
]) {
  await prisma.user.upsert({
    where: { wallet },
    update: { name },
    create: { wallet, name }
  });
}

// 기존 데모 댓글 정리 후 재삽입
await prisma.comment.deleteMany({ where: { quizId: quiz.id } });

const top1 = await prisma.comment.create({
  data: {
    quizId: quiz.id,
    questionIndex: 0,
    wallet: ALICE,
    isSubmission: true,
    body: "상태(state)는 모든 계좌의 잔액·컨트랙트 저장값을 담은 '현재 스냅샷'이고, 트랜잭션은 그 상태를 바꾸는 요청, 블록은 트랜잭션을 묶어 순서를 확정하는 단위라고 이해했어요. 맞을까요?"
  }
});

await prisma.comment.create({
  data: {
    quizId: quiz.id,
    questionIndex: 0,
    parentId: top1.id,
    wallet: ADMIN,
    body: "정확합니다 👍 한 가지만 더하면, 블록이 적용될 때마다 state가 S -> S' 로 전이하고, 그 전이 규칙이 곧 EVM이에요. 그래서 '상태 기계'라고 부릅니다."
  }
});

await prisma.comment.create({
  data: {
    quizId: quiz.id,
    questionIndex: 0,
    wallet: BOB,
    isSubmission: true,
    body: "저는 트랜잭션이 곧바로 상태를 바꾸는 줄 알았는데, 블록에 담겨 합의가 되어야 확정되는 거군요. 여기가 헷갈렸습니다."
  }
});

await prisma.comment.create({
  data: {
    quizId: quiz.id,
    questionIndex: 4,
    wallet: BOB,
    isSubmission: true,
    body: "Infura는 노드를 대신 운영해주고 RPC 엔드포인트를 빌려주는 회사라고 이해했어요."
  }
});

const counts = await prisma.comment.count({ where: { quizId: quiz.id } });
console.log(`seeded quiz=${quiz.slug} comments=${counts}`);
await prisma.$disconnect();
