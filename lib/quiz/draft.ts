import type { QuizAnswer } from "./parse";
import { isAnswered } from "./answerText";

/**
 * 브라우저 임시저장(localStorage) 읽기/쓰기.
 * 저장 실패(용량 초과 등)와 손상된 데이터는 조용히 무시한다.
 */

export function readDraft(
  key: string,
  expectedLength: number
): { answers: QuizAnswer[]; hasContent: boolean } | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== expectedLength) return null;
    return { answers: parsed, hasContent: parsed.some(isAnswered) };
  } catch {
    return null;
  }
}

export function writeDraft(key: string, answers: QuizAnswer[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(answers));
  } catch {
    // 저장 공간 초과 등은 조용히 무시
  }
}
