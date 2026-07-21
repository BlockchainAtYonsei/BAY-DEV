import { prisma } from "./db";

export type Lecture = {
  id: string;
  slug: string;
  title: string;
  badge: string;
  track: string;
  order: number;
  format: string;
  markdown: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

type LectureRow = {
  id: string;
  slug: string;
  title: string;
  badge: string;
  track: string;
  order: number;
  format: string;
  markdown: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function toLecture(row: LectureRow): Lecture {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export type LectureInput = {
  slug: string;
  title: string;
  badge: string;
  track: string;
  order: number;
  format: string;
  markdown: string;
  published: boolean;
};

export const lectureStore = {
  async list(): Promise<Lecture[]> {
    const rows = await prisma.lecture.findMany({
      orderBy: [{ track: "asc" }, { order: "asc" }, { createdAt: "asc" }]
    });
    return rows.map(toLecture);
  },

  async listPublished(): Promise<Lecture[]> {
    const rows = await prisma.lecture.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }]
    });
    return rows.map(toLecture);
  },

  async findBySlug(slug: string): Promise<Lecture | null> {
    const row = await prisma.lecture.findUnique({ where: { slug } });
    return row ? toLecture(row) : null;
  },

  async findById(id: string): Promise<Lecture | null> {
    const row = await prisma.lecture.findUnique({ where: { id } });
    return row ? toLecture(row) : null;
  },

  async create(input: LectureInput): Promise<Lecture> {
    const row = await prisma.lecture.create({ data: input });
    return toLecture(row);
  },

  async update(id: string, input: Partial<LectureInput>): Promise<Lecture> {
    const row = await prisma.lecture.update({ where: { id }, data: input });
    return toLecture(row);
  },

  async remove(id: string): Promise<void> {
    await prisma.lecture.delete({ where: { id } });
  }
};
