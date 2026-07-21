import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { quizStore } from "@/lib/quizStore";
import { parseQuiz } from "@/lib/quiz/parse";
import { parseQuizInput } from "@/lib/quiz/validation";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  const [quizzes, counts] = await Promise.all([
    quizStore.list(),
    quizStore.countResponses()
  ]);
  return NextResponse.json({
    quizzes: quizzes.map((quiz) => ({
      ...quiz,
      questionCount: parseQuiz(quiz.markdown).questions.length,
      responseCount: counts[quiz.id] || 0
    }))
  });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  const parsed = parseQuizInput(await request.json().catch(() => null));
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  if (await quizStore.findBySlug(parsed.input.slug)) {
    return NextResponse.json({ error: "이미 사용 중인 slug입니다." }, { status: 409 });
  }
  const quiz = await quizStore.create(parsed.input);
  return NextResponse.json({ quiz });
}
