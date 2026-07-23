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

/** DB 행 하나를 조회자 관점의 노드로 변환. 작성자는 지갑 주소로만 식별한다. */
function toNode(row: CommentRow, opts: ViewOptions): CommentNode {
  const deleted = row.deletedAt !== null;
  return {
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
}

/** 대댓글을 부모 id별로 묶는다 */
function groupReplies(rows: CommentRow[]): Map<string, CommentRow[]> {
  const byParent = new Map<string, CommentRow[]>();
  for (const row of rows) {
    if (row.parentId === null) continue;
    const list = byParent.get(row.parentId) || [];
    list.push(row);
    byParent.set(row.parentId, list);
  }
  return byParent;
}

/** 삭제됐고 답글도 없는 최상위 글은 숨긴다 */
function isVisibleTop(node: CommentNode): boolean {
  return !(node.deleted && node.replies.length === 0);
}

/** 최상위 → 대댓글 2단 트리 조립 (최상위는 최신순, 대댓글은 대화순) */
function buildTree(rows: CommentRow[], opts: ViewOptions): CommentNode[] {
  const byParent = groupReplies(rows);
  return rows
    .filter((r) => r.parentId === null)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((top) => ({
      ...toNode(top, opts),
      replies: (byParent.get(top.id) || [])
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((row) => toNode(row, opts))
    }))
    .filter(isVisibleTop);
}

/** 관리자 뷰 노드 — 이름 포함. 관리자 API에서만 사용할 것. */
export type AdminCommentNode = {
  id: string;
  wallet: string;
  /** User 테이블에서 조회한 이름 (미등록이면 null) */
  name: string | null;
  body: string | null;
  deleted: boolean;
  isSubmission: boolean;
  createdAt: string;
  replies: AdminCommentNode[];
};

function toAdminNode(row: CommentRow, names: Map<string, string>): AdminCommentNode {
  const deleted = row.deletedAt !== null;
  return {
    id: row.id,
    wallet: row.wallet,
    name: names.get(row.wallet) ?? null,
    body: deleted ? null : row.body,
    deleted,
    isSubmission: row.isSubmission,
    createdAt: row.createdAt.toISOString(),
    replies: []
  };
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

  /**
   * 관리자용: 퀴즈 전체 토론을 문항별 트리로, 작성자 이름을 붙여 조회.
   * 이름이 학생에게 새지 않도록 반드시 관리자 가드 뒤에서만 호출할 것.
   */
  async adminThreadsByQuestion(
    quizId: string
  ): Promise<Record<number, AdminCommentNode[]>> {
    const rows = (await prisma.comment.findMany({ where: { quizId } })) as CommentRow[];
    if (rows.length === 0) return {};

    const wallets = [...new Set(rows.map((r) => r.wallet))];
    const users = await prisma.user.findMany({ where: { wallet: { in: wallets } } });
    const names = new Map(users.map((u) => [u.wallet, u.name]));

    const byQuestion: Record<number, AdminCommentNode[]> = {};
    const questionIndexes = [...new Set(rows.map((r) => r.questionIndex))];
    for (const qi of questionIndexes) {
      const qRows = rows.filter((r) => r.questionIndex === qi);
      const byParent = groupReplies(qRows);
      byQuestion[qi] = qRows
        .filter((r) => r.parentId === null)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((top) => ({
          ...toAdminNode(top, names),
          replies: (byParent.get(top.id) || [])
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .map((row) => toAdminNode(row, names))
        }))
        .filter((node) => !(node.deleted && node.replies.length === 0));
    }
    return byQuestion;
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

  /** 스레드(최상위 글 + 그 답글들) 참여자 지갑 목록 (중복 제거, 삭제 글 포함) */
  async threadParticipants(parentId: string): Promise<string[]> {
    const rows = await prisma.comment.findMany({
      where: { OR: [{ id: parentId }, { parentId }] },
      select: { wallet: true }
    });
    return [...new Set(rows.map((r) => r.wallet))];
  },

  /** 소프트 삭제 */
  async softDelete(id: string) {
    return prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
};
