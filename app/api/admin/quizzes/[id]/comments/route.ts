import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/guards";
import { quizStore } from "@/lib/quizStore";
import { commentStore } from "@/lib/commentStore";
import { parseQuiz } from "@/lib/quiz/parse";

type Params = { params: Promise<{ id: string }> };

/** 관리자용: 퀴즈 전체 토론(문항별 트리, 작성자 이름 포함) */
export async function GET(_request: Request, { params }: Params) {
  const adminGuard = await requireAdmin();
  if (!adminGuard.ok) return adminGuard.res;

  const { id } = await params;
  const quiz = await quizStore.findById(id);
  if (!quiz) {
    return NextResponse.json({ error: "퀴즈를 찾을 수 없습니다." }, { status: 404 });
  }

  const [threads, parsed] = await Promise.all([
    commentStore.adminThreadsByQuestion(quiz.id),
    Promise.resolve(parseQuiz(quiz.markdown))
  ]);

  return NextResponse.json({
    quiz: { id: quiz.id, title: quiz.title },
    questions: parsed.questions.map((q) => ({ index: q.index, prompt: q.prompt })),
    threads
  });
}
