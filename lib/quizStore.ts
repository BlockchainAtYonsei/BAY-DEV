import { prisma } from "./db";
import type { QuizAnswer } from "./quiz/parse";

export type Quiz = {
  id: string;
  slug: string;
  title: string;
  badge: string;
  markdown: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type QuizResponse = {
  id: string;
  quizId: string;
  wallet: string;
  name: string;
  answers: QuizAnswer[];
  score: number;
  total: number;
  createdAt: string;
  updatedAt: string;
};

type QuizRow = {
  id: string;
  slug: string;
  title: string;
  badge: string;
  markdown: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ResponseRow = {
  id: string;
  quizId: string;
  wallet: string;
  name: string;
  answers: string;
  score: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
};

function toQuiz(row: QuizRow): Quiz {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function toResponse(row: ResponseRow): QuizResponse {
  let answers: QuizAnswer[] = [];
  try {
    const parsed = JSON.parse(row.answers);
    if (Array.isArray(parsed)) answers = parsed;
  } catch {
    // 손상된 응답은 빈 배열로 취급
  }
  return {
    ...row,
    answers,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export const quizStore = {
  async list(): Promise<Quiz[]> {
    const rows = await prisma.quiz.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(toQuiz);
  },

  async listPublished(): Promise<Quiz[]> {
    const rows = await prisma.quiz.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" }
    });
    return rows.map(toQuiz);
  },

  async findBySlug(slug: string): Promise<Quiz | null> {
    const row = await prisma.quiz.findUnique({ where: { slug } });
    return row ? toQuiz(row) : null;
  },

  async findById(id: string): Promise<Quiz | null> {
    const row = await prisma.quiz.findUnique({ where: { id } });
    return row ? toQuiz(row) : null;
  },

  async create(input: {
    slug: string;
    title: string;
    badge: string;
    markdown: string;
    published: boolean;
  }): Promise<Quiz> {
    const row = await prisma.quiz.create({ data: input });
    return toQuiz(row);
  },

  async update(
    id: string,
    input: Partial<{
      slug: string;
      title: string;
      badge: string;
      markdown: string;
      published: boolean;
    }>
  ): Promise<Quiz> {
    const row = await prisma.quiz.update({ where: { id }, data: input });
    return toQuiz(row);
  },

  async remove(id: string): Promise<void> {
    await prisma.$transaction([
      prisma.quizResponse.deleteMany({ where: { quizId: id } }),
      prisma.quiz.delete({ where: { id } })
    ]);
  },

  async findResponse(quizId: string, wallet: string): Promise<QuizResponse | null> {
    const row = await prisma.quizResponse.findUnique({
      where: { quizId_wallet: { quizId, wallet: wallet.toLowerCase() } }
    });
    return row ? toResponse(row) : null;
  },

  async listResponses(quizId: string): Promise<QuizResponse[]> {
    const rows = await prisma.quizResponse.findMany({
      where: { quizId },
      orderBy: { updatedAt: "desc" }
    });
    return rows.map(toResponse);
  },

  async countResponses(): Promise<Record<string, number>> {
    const groups = await prisma.quizResponse.groupBy({
      by: ["quizId"],
      _count: { quizId: true }
    });
    return Object.fromEntries(groups.map((g) => [g.quizId, g._count.quizId]));
  },

  async upsertResponse(input: {
    quizId: string;
    wallet: string;
    name: string;
    answers: QuizAnswer[];
    score: number;
    total: number;
  }): Promise<QuizResponse> {
    const wallet = input.wallet.toLowerCase();
    const data = {
      name: input.name.trim(),
      answers: JSON.stringify(input.answers),
      score: input.score,
      total: input.total
    };
    const row = await prisma.quizResponse.upsert({
      where: { quizId_wallet: { quizId: input.quizId, wallet } },
      update: data,
      create: { ...data, quizId: input.quizId, wallet }
    });
    return toResponse(row);
  }
};
