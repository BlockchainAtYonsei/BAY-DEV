import { prisma } from "./db";

export type CommentNode = {
  id: string;
  wallet: string;
  /** 삭제된 글이면 null */
  body: string | null;
  deleted: boolean;
  /** 퀴즈 답 제출로 올라온 최상위 글 */
  isSubmission: boolean;
  isAdmin: boolean;
  isMine: boolean;
  createdAt: string;
  replies: CommentNode[];
};

type CommentRow = {
  id: string;
  quizId: string;
  questionIndex: number;
  wallet: string;
  body: string;
  isSubmission: boolean;
  parentId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type ViewOptions = {
  /** 조회자 지갑 — 본인 글 표시(isMine)와 삭제 권한 판정에 사용 */
  viewerWallet: string | null;
  /** 관리자 배지를 붙일 지갑 집합 */
  adminWallets: Set<string>;
};

/** 최상위 → 대댓글 2단 트리로 조립. 작성자는 지갑 주소로만 식별한다. */
function buildTree(rows: CommentRow[], opts: ViewOptions): CommentNode[] {
  const toNode = (row: CommentRow): CommentNode => {
    const deleted = row.deletedAt !== null;
    const node: CommentNode = {
      id: row.id,
      wallet: row.wallet,
      body: deleted ? null : row.body,
      deleted,
      isSubmission: row.isSubmission,
      isAdmin: opts.adminWallets.has(row.wallet),
      isMine: opts.viewerWallet === row.wallet,
      createdAt: row.createdAt.toISOString(),
      replies: []
    };
    return node;
  };

  const tops = rows.filter((r) => r.parentId === null);
  const byParent = new Map<string, CommentRow[]>();
  for (const r of rows) {
    if (r.parentId === null) continue;
    const list = byParent.get(r.parentId) || [];
    list.push(r);
    byParent.set(r.parentId, list);
  }

  return tops
    // 최상위는 최신 글이 위로
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((top) => {
      const node = toNode(top);
      const replies = (byParent.get(top.id) || [])
        // 대댓글은 대화 순서대로(오래된 것부터)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map(toNode);
      node.replies = replies;
      // 삭제됐지만 답글이 남은 글은 유지, 답글도 없이 삭제된 최상위 글은 숨긴다
      return node;
    })
    .filter((node) => !(node.deleted && node.replies.length === 0));
}

export const commentStore = {
  /** 특정 문항의 토론 트리 */
  async listForQuestion(
    quizId: string,
    questionIndex: number,
    opts: ViewOptions
  ): Promise<CommentNode[]> {
    const rows = (await prisma.comment.findMany({
      where: { quizId, questionIndex }
    })) as CommentRow[];

    return buildTree(rows, opts);
  },

  /** 문항별 댓글 수 (질문 인덱스 → 개수), 삭제 제외 */
  async countByQuestion(quizId: string): Promise<Record<number, number>> {
    const groups = await prisma.comment.groupBy({
      by: ["questionIndex"],
      where: { quizId, deletedAt: null },
      _count: { questionIndex: true }
    });
    return Object.fromEntries(
      groups.map((g) => [g.questionIndex, g._count.questionIndex])
    );
  },

  async findById(id: string) {
    return prisma.comment.findUnique({ where: { id } });
  },

  async create(input: {
    quizId: string;
    questionIndex: number;
    wallet: string;
    body: string;
    parentId: string | null;
  }) {
    return prisma.comment.create({
      data: {
        quizId: input.quizId,
        questionIndex: input.questionIndex,
        wallet: input.wallet.toLowerCase(),
        body: input.body.trim(),
        parentId: input.parentId
      }
    });
  },

  /** 퀴즈 답 제출 → 그 문항 토론의 최상위 글로 올린다. 지갑·문항당 하나(재제출 시 수정). */
  async upsertSubmission(input: {
    quizId: string;
    questionIndex: number;
    wallet: string;
    body: string;
  }) {
    const wallet = input.wallet.toLowerCase();
    const body = input.body.trim();
    const existing = await prisma.comment.findFirst({
      where: {
        quizId: input.quizId,
        questionIndex: input.questionIndex,
        wallet,
        isSubmission: true,
        parentId: null
      }
    });
    if (existing) {
      return prisma.comment.update({
        where: { id: existing.id },
        data: { body, deletedAt: null }
      });
    }
    return prisma.comment.create({
      data: {
        quizId: input.quizId,
        questionIndex: input.questionIndex,
        wallet,
        body,
        isSubmission: true
      }
    });
  },

  /** 소프트 삭제 */
  async softDelete(id: string) {
    return prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
};
