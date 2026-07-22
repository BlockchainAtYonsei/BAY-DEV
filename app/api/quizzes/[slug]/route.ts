import { NextResponse } from "next/server";
import { getWalletSession } from "@/lib/session";
import {
  jsonError,
  requirePublishedQuiz,
  requireRegisteredUser
} from "@/lib/api/guards";
import { quizStore } from "@/lib/quizStore";
import { gradeAnswers, parseQuiz, sanitizeAnswers, toPublicQuestions } from "@/lib/quiz/parse";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const quizGuard = await requirePublishedQuiz(slug);
  if (!quizGuard.ok) return quizGuard.res;
  const quiz = quizGuard.value;

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
  const userGuard = await requireRegisteredUser();
  if (!userGuard.ok) return userGuard.res;
  const user = userGuard.value;

  const { slug } = await params;
  const quizGuard = await requirePublishedQuiz(slug);
  if (!quizGuard.ok) return quizGuard.res;
  const quiz = quizGuard.value;

  const body = await request.json().catch(() => null);
  const questions = parseQuiz(quiz.markdown).questions;
  const answers = sanitizeAnswers(questions, body?.answers);
  if (!answers) {
    return jsonError("응답 형식이 올바르지 않습니다.", 400);
  }

  const { score, total } = gradeAnswers(questions, answers);
  const response = await quizStore.upsertResponse({
    quizId: quiz.id,
    wallet: user.wallet,
    name: user.name,
    answers,
    score,
    total
  });

  return NextResponse.json({
    myResponse: { answers: response.answers, updatedAt: response.updatedAt }
  });
}
