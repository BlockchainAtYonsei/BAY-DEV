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

  const admin = await isAdmin();
  const comments = await commentStore.listForQuestion(quiz.id, questionIndex, {
    viewerWallet: session.wallet,
    adminWallets: getAdminWallets()
  });

  return NextResponse.json({ comments, isAdminViewer: admin });
}

export async function POST(request: Request, { params }: Params) {
  const userGuard = await requireRegisteredUser();
  if (!userGuard.ok) return userGuard.res;
  const session = userGuard.value;

  const { slug } = await params;
  const quizGuard = await requirePublishedQuiz(slug);
  if (!quizGuard.ok) return quizGuard.res;
  const quiz = quizGuard.value;

  const body = (await request.json().catch(() => null)) as {
    questionIndex?: number;
    body?: string;
    parentId?: string | null;
    isSubmission?: boolean;
  } | null;

  const questionCount = parseQuiz(quiz.markdown).questions.length;
  const questionIndex = body?.questionIndex;
  if (
    typeof questionIndex !== "number" ||
    !Number.isInteger(questionIndex) ||
    questionIndex < 0 ||
    questionIndex >= questionCount
  ) {
    return jsonError("문항 번호가 올바르지 않습니다.", 400);
  }

  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text) {
    return jsonError("내용을 입력해 주세요.", 400);
  }
  if (text.length > MAX_BODY) {
    return jsonError("내용이 너무 깁니다.", 400);
  }

  if (body?.isSubmission) {
    // 퀴즈 답 제출 → 최상위 글로 upsert (지갑·문항당 하나)
    await commentStore.upsertSubmission({
      quizId: quiz.id,
      questionIndex,
      wallet: session.wallet,
      body: text
    });
  } else {
    // 대댓글: 부모가 같은 퀴즈·문항의 최상위 글이어야 한다 (2단 캡)
    if (!body?.parentId) {
      return jsonError("답글 대상이 필요합니다.", 400);
    }
    const parent = await commentStore.findById(body.parentId);
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

    // 스레드 참여자(글쓴이 + 기존 답글 작성자)에게 푸시 — 응답을 막지 않게 백그라운드로
    const participants = (await commentStore.threadParticipants(parent.id)).filter(
      (w) => w !== session.wallet
    );
    const preview = text.length > 60 ? `${text.slice(0, 60)}…` : text;
    void sendPushToWallets(participants, {
      title: `Q${questionIndex + 1} 토론에 새 답글`,
      body: preview,
      url: `/quiz/${slug}`
    }).catch(() => {});
  }

  const admin = await isAdmin();
  const comments = await commentStore.listForQuestion(quiz.id, questionIndex, {
    viewerWallet: session.wallet,
    adminWallets: getAdminWallets()
  });

  return NextResponse.json({ comments, isAdminViewer: admin });
}
