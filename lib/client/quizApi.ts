import { fetchJson } from "./http";
import type { QuizAnswer } from "@/lib/quiz/parse";

/** 답안 전체를 서버에 저장하고 제출 시각을 돌려받는다 */
export async function saveQuizAnswers(
  slug: string,
  answers: QuizAnswer[]
): Promise<string> {
  const data = await fetchJson<{ myResponse: { updatedAt: string } }>(
    `/api/quizzes/${slug}`,
    { method: "POST", body: { answers } }
  );
  return data.myResponse.updatedAt;
}

/** 문항 답을 해당 문항 토론의 최상위 글로 올린다 (지갑·문항당 하나, 재제출 시 수정) */
export async function postSubmissionComment(
  slug: string,
  questionIndex: number,
  body: string
): Promise<void> {
  await fetchJson(`/api/quizzes/${slug}/comments`, {
    method: "POST",
    body: { questionIndex, body, isSubmission: true }
  });
}
