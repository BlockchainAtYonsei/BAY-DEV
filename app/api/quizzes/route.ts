import { NextResponse } from "next/server";
import { getWalletSession } from "@/lib/session";
import { quizStore } from "@/lib/quizStore";
import { parseQuiz } from "@/lib/quiz/parse";

export async function GET() {
  const quizzes = await quizStore.listPublished();
  const session = await getWalletSession();

  const items = await Promise.all(
    quizzes.map(async (quiz) => {
      const response = session ? await quizStore.findResponse(quiz.id, session.wallet) : null;
      return {
        slug: quiz.slug,
        title: quiz.title,
        badge: quiz.badge,
        questionCount: parseQuiz(quiz.markdown).questions.length,
        submittedAt: response ? response.updatedAt : null
      };
    })
  );

  return NextResponse.json({ quizzes: items });
}
