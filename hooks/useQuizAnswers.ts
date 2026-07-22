"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicQuizQuestion, QuizAnswer } from "@/lib/quiz/parse";
import { isAnswered } from "@/lib/quiz/answerText";
import { readDraft, writeDraft } from "@/lib/quiz/draft";

export type PublicQuiz = {
  slug: string;
  title: string;
  badge: string;
  intro: string;
  questions: PublicQuizQuestion[];
};

/**
 * 퀴즈 로딩 + 답안 상태 + 브라우저 임시저장.
 * 서버에 제출된 응답이 있으면 그것이 우선이고, 없으면 지갑별 localStorage 초안을 복원한다.
 */
export function useQuizAnswers(slug: string, wallet: string | null, loggedIn: boolean) {
  const [quiz, setQuiz] = useState<PublicQuiz | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  // 임시저장 로드가 끝나기 전에는 localStorage에 쓰지 않는다(빈 답으로 덮어쓰기 방지)
  const [ready, setReady] = useState(false);

  // 지갑별로 임시저장을 분리해 한 브라우저를 공유해도 답이 섞이지 않게 한다
  const draftKey = `bay-quiz-draft:${slug}:${wallet || "anon"}`;

  const load = useCallback(async () => {
    setReady(false);
    const res = await fetch(`/api/quizzes/${slug}`);
    if (!res.ok) {
      setNotFound(true);
      return;
    }
    const data = await res.json();
    setQuiz(data.quiz);

    const questionCount = data.quiz.questions.length;
    if (data.myResponse?.answers?.length) {
      // 서버에 제출된 응답이 최우선
      setAnswers(data.myResponse.answers);
      setDraftRestored(false);
    } else {
      // 제출 전이면 브라우저 임시저장을 복원
      const draft = readDraft(draftKey, questionCount);
      setAnswers(draft?.answers ?? new Array(questionCount).fill(null));
      setDraftRestored(Boolean(draft?.hasContent));
    }
    setSubmittedAt(data.myResponse?.updatedAt || null);
    setReady(true);
  }, [slug, draftKey]);

  useEffect(() => {
    load();
  }, [load, loggedIn]);

  // 답을 바꿀 때마다 브라우저에 임시저장 (제출 여부와 무관하게 계속 기억)
  useEffect(() => {
    if (ready) writeDraft(draftKey, answers);
  }, [answers, ready, draftKey]);

  const setAnswer = useCallback((index: number, value: QuizAnswer) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const toggleMultiple = useCallback((index: number, optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      const current = Array.isArray(next[index]) ? (next[index] as number[]) : [];
      next[index] = current.includes(optionIndex)
        ? current.filter((v) => v !== optionIndex)
        : [...current, optionIndex].sort((a, b) => a - b);
      return next;
    });
  }, []);

  return {
    quiz,
    notFound,
    answers,
    setAnswer,
    toggleMultiple,
    submittedAt,
    setSubmittedAt,
    draftRestored,
    answeredCount: answers.filter(isAnswered).length
  };
}
