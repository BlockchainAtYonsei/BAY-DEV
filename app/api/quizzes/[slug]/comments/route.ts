import { NextResponse } from "next/server";
import { isAdmin, getAdminWallets } from "@/lib/session";
import {
  jsonError,
  requirePublishedQuiz,
  requireRegisteredUser,
  requireWallet
} from "@/lib/api/guards";
import { commentStore } from "@/lib/commentStore";
import { parseQuiz } from "@/lib/quiz/parse";
import { sendPushToWallets } from "@/lib/push";

type Params = { params: Promise<{ slug: string }> };

const MAX_BODY = 2000;

type CommentInput = {
  questionIndex: number;
  text: string;
  parentId: string | null;
  isSubmission: boolean;
};

/** 요청 본문 검증만 담당 — 통과하면 정규화된 입력을 돌려준다 */
function parseCommentInput(
  raw: unknown,
  questionCount: number
): { ok: true; value: CommentInput } | { ok: false; error: string } {
  const body = raw as {
    questionIndex?: number;
    body?: string;
    parentId?: string | null;
    isSubmission?: boolean;
  } | null;

  const questionIndex = body?.questionIndex;
  if (
    typeof questionIndex !== "number" ||
    !Number.isInteger(questionIndex) ||
    questionIndex < 0 ||
    questionIndex >= questionCount
  ) {
    return { ok: false, error: "문항 번호가 올바르지 않습니다." };
  }

  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text) return { ok: false, error: "내용을 입력해 주세요." };
  if (text.length > MAX_BODY) return { ok: false, error: "내용이 너무 깁니다." };

  return {
    ok: true,
    value: {
      questionIndex,
      text,
      parentId: body?.parentId ?? null,
      isSubmission: body?.isSubmission === true
    }
  };
}

/** 스레드 참여자(작성자 본인 제외)에게 푸시 발송 — 응답을 막지 않게 백그라운드로 */
async function notifyThreadParticipants(
  parentId: string,
  actorWallet: string,
  slug: string,
  questionIndex: number,
  text: string
) {
  const participants = (await commentStore.threadParticipants(parentId)).filter(
    (w) => w !== actorWallet
  );
  const preview = text.length > 60 ? `${text.slice(0, 60)}…` : text;
  await sendPushToWallets(participants, {
    title: `Q${questionIndex + 1} 토론에 새 답글`,
    body: preview,
    url: `/quiz/${slug}`
  });
}

/** 문항 토론 트리를 조회자 관점으로 조립해 응답한다 (GET/POST 공용) */
async function threadResponse(quizId: string, questionIndex: number, viewerWallet: string) {
  const admin = await isAdmin();
  const comments = await commentStore.listForQuestion(quizId, questionIndex, {
    viewerWallet,
    adminWallets: getAdminWallets()
  });
  return NextResponse.json({ comments, isAdminViewer: admin });
}

export async function GET(request: Request, { params }: Params) {
  const sessionGuard = await requireWallet();
  if (!sessionGuard.ok) return sessionGuard.res;
  const session = sessionGuard.value;

  const { slug } = await params;
  const quizGuard = await requirePublishedQuiz(slug);
  if (!quizGuard.ok) return quizGuard.res;
  const quiz = quizGuard.value;

  // q 파라미터가 없으면 문항별 댓글 수만 내려준다 (뱃지용)
  const q = new URL(request.url).searchParams.get("q");
  if (q === null) {
    const counts = await commentStore.countByQuestion(quiz.id);
    return NextResponse.json({ counts });
  }

  const questionIndex = Number(q);
  if (!Number.isInteger(questionIndex) || questionIndex < 0) {
    return jsonError("문항 번호가 올바르지 않습니다.", 400);
  }

  return threadResponse(quiz.id, questionIndex, session.wallet);
}

export async function POST(request: Request, { params }: Params) {
  const userGuard = await requireRegisteredUser();
  if (!userGuard.ok) return userGuard.res;
  const session = userGuard.value;

  const { slug } = await params;
  const quizGuard = await requirePublishedQuiz(slug);
  if (!quizGuard.ok) return quizGuard.res;
  const quiz = quizGuard.value;

  const questionCount = parseQuiz(quiz.markdown).questions.length;
  const parsed = parseCommentInput(await request.json().catch(() => null), questionCount);
  if (!parsed.ok) return jsonError(parsed.error, 400);
  const { questionIndex, text, parentId, isSubmission } = parsed.value;

  if (isSubmission) {
    // 퀴즈 답 제출 → 최상위 글로 upsert (지갑·문항당 하나)
    await commentStore.upsertSubmission({
      quizId: quiz.id,
      questionIndex,
      wallet: session.wallet,
      body: text
    });
  } else {
    // 대댓글: 부모가 같은 퀴즈·문항의 최상위 글이어야 한다 (2단 캡)
    if (!parentId) {
      return jsonError("답글 대상이 필요합니다.", 400);
    }
    const parent = await commentStore.findById(parentId);
    if (
      !parent ||
      parent.quizId !== quiz.id ||
      parent.questionIndex !== questionIndex ||
      parent.parentId !== null
    ) {
      return jsonError("답글 대상을 찾을 수 없습니다.", 400);
    }
    await commentStore.create({
      quizId: quiz.id,
      questionIndex,
      wallet: session.wallet,
      body: text,
      parentId: parent.id
    });
    void notifyThreadParticipants(parent.id, session.wallet, slug, questionIndex, text).catch(
      () => {}
    );
  }

  return threadResponse(quiz.id, questionIndex, session.wallet);
}
