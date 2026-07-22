import type { PublicQuizQuestion, QuizAnswer } from "./parse";

/** 문항 답을 사람이 읽을 텍스트로 변환 (토론 제출글 본문용) */
export function answerText(question: PublicQuizQuestion, answer: QuizAnswer): string {
  if (question.type === "text") return typeof answer === "string" ? answer.trim() : "";
  if (question.type === "single")
    return typeof answer === "number" ? question.options[answer] ?? "" : "";
  if (question.type === "multiple")
    return Array.isArray(answer)
      ? answer.map((i) => question.options[i]).filter(Boolean).join(", ")
      : "";
  return "";
}

/** 응답으로 인정되는 값인지 (빈 문자열·빈 배열·null 제외) */
export function isAnswered(answer: QuizAnswer): boolean {
  return answer !== null && answer !== "" && !(Array.isArray(answer) && answer.length === 0);
}
