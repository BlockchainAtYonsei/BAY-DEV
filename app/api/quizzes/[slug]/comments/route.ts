import { NextResponse } from "next/server";
import { getWalletSession, isAdmin, getAdminWallets } from "@/lib/session";
import { userStore } from "@/lib/userStore";
import { quizStore } from "@/lib/quizStore";
import { commentStore } from "@/lib/commentStore";
import { parseQuiz } from "@/lib/quiz/parse";
import { sendPushToWallets } from "@/lib/push";

type Params = { params: Promise<{ slug: string }> };

const MAX_BODY = 2000;

export async function GET(request: Request, { params }: Params) {
  const session = await getWalletSession();
  if (!session) {
    return NextResponse.json({ error: "지갑 로그인이 필요합니다." }, { status: 401 });
  }

  const { slug } = await params;
  const quiz = await quizStore.findBySlug(slug);
  if (!quiz || !quiz.published) {
    return NextResponse.json({ error: "퀴즈를 찾을 수 없습니다." }, { status: 404 });
  }

  // q 파라미터가 없으면 문항별 댓글 수만 내려준다 (뱃지용)
  const q = new URL(request.url).searchParams.get("q");
  if (q === null) {
    const counts = await commentStore.countByQuestion(quiz.id);
    return NextResponse.json({ counts });
  }

  const questionIndex = Number(q);
  if (!Number.isInteger(questionIndex) || questionIndex < 0) {
    return NextResponse.json({ error: "문항 번호가 올바르지 않습니다." }, { status: 400 });
  }

  const admin = await isAdmin();
  const comments = await commentStore.listForQuestion(quiz.id, questionIndex, {
    viewerWallet: session.wallet,
    adminWallets: getAdminWallets()
  });

  return NextResponse.json({ comments, isAdminViewer: admin });
}

export async function POST(request: Request, { params }: Params) {
  const session = await getWalletSession();
  if (!session) {
    return NextResponse.json({ error: "지갑 로그인이 필요합니다." }, { status: 401 });
  }
  const user = await userStore.findByWallet(session.wallet);
  if (!user) {
    return NextResponse.json({ error: "이름 등록이 필요합니다." }, { status: 403 });
  }

  const { slug } = await params;
  const quiz = await quizStore.findBySlug(slug);
  if (!quiz || !quiz.published) {
    return NextResponse.json({ error: "퀴즈를 찾을 수 없습니다." }, { status: 404 });
  }

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
    return NextResponse.json({ error: "문항 번호가 올바르지 않습니다." }, { status: 400 });
  }

  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "내용을 입력해 주세요." }, { status: 400 });
  }
  if (text.length > MAX_BODY) {
    return NextResponse.json({ error: "내용이 너무 깁니다." }, { status: 400 });
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
      return NextResponse.json({ error: "답글 대상이 필요합니다." }, { status: 400 });
    }
    const parent = await commentStore.findById(body.parentId);
    if (
      !parent ||
      parent.quizId !== quiz.id ||
      parent.questionIndex !== questionIndex ||
      parent.parentId !== null
    ) {
      return NextResponse.json({ error: "답글 대상을 찾을 수 없습니다." }, { status: 400 });
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
