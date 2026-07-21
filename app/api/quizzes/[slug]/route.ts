import { NextResponse } from "next/server";
import { getWalletSession } from "@/lib/session";
import { userStore } from "@/lib/userStore";
import { quizStore } from "@/lib/quizStore";
import { gradeAnswers, parseQuiz, sanitizeAnswers, toPublicQuestions } from "@/lib/quiz/parse";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const quiz = await quizStore.findBySlug(slug);
  if (!quiz || !quiz.published) {
    return NextResponse.json({ error: "퀴즈를 찾을 수 없습니다." }, { status: 404 });
  }

  const parsed = parseQuiz(quiz.markdown);
  const session = await getWalletSession();
  const response = session ? await quizStore.findResponse(quiz.id, session.wallet) : null;

  return NextResponse.json({
    quiz: {
      slug: quiz.slug,
      title: parsed.title || quiz.title,
      badge: quiz.badge,
      intro: parsed.intro,
      questions: toPublicQuestions(parsed.questions)
    },
    myResponse: response
      ? { answers: response.answers, updatedAt: response.updatedAt }
      : null
  });
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
  const body = await request.json().catch(() => null);
  const questions = parseQuiz(quiz.markdown).questions;
  const answers = sanitizeAnswers(questions, body?.answers);
  if (!answers) {
    return NextResponse.json({ error: "응답 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const { score, total } = gradeAnswers(questions, answers);
  const response = await quizStore.upsertResponse({
    quizId: quiz.id,
    wallet: session.wallet,
    name: user.name,
    answers,
    score,
    total
  });

  return NextResponse.json({
    myResponse: { answers: response.answers, updatedAt: response.updatedAt }
  });
}
