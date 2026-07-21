"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import Markdown from "@/components/quiz/Markdown";
import { useSession } from "@/hooks/useSession";
import type { PublicQuizQuestion, QuizAnswer } from "@/lib/quiz/parse";

type PublicQuiz = {
  slug: string;
  title: string;
  badge: string;
  intro: string;
  questions: PublicQuizQuestion[];
};

type Props = {
  slug: string;
};

export default function QuizForm({ slug }: Props) {
  const auth = useSession();
  const loggedIn = Boolean(auth.session?.name);
  const wallet = auth.session?.wallet || null;

  const [quiz, setQuiz] = useState<PublicQuiz | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
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

    const blank: QuizAnswer[] = new Array(data.quiz.questions.length).fill(null);
    if (data.myResponse?.answers?.length) {
      // 서버에 제출된 응답이 최우선
      setAnswers(data.myResponse.answers);
      setDraftRestored(false);
    } else {
      // 제출 전이라면 브라우저에 적어두던 임시 답안을 복원
      let restored = blank;
      let hadDraft = false;
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length === blank.length) {
            restored = parsed;
            hadDraft = parsed.some(
              (a) => a !== null && a !== "" && !(Array.isArray(a) && a.length === 0)
            );
          }
        }
      } catch {
        // 손상된 임시저장은 무시
      }
      setAnswers(restored);
      setDraftRestored(hadDraft);
    }
    setSubmittedAt(data.myResponse?.updatedAt || null);
    setReady(true);
  }, [slug, draftKey]);

  useEffect(() => {
    load();
  }, [load, loggedIn]);

  // 답을 바꿀 때마다 브라우저에 임시저장 (제출 여부와 무관하게 계속 기억)
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify(answers));
    } catch {
      // 저장 공간 초과 등은 조용히 무시
    }
  }, [answers, ready, draftKey]);

  function setAnswer(index: number, value: QuizAnswer) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function toggleMultiple(index: number, optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      const current = Array.isArray(next[index]) ? (next[index] as number[]) : [];
      next[index] = current.includes(optionIndex)
        ? current.filter((v) => v !== optionIndex)
        : [...current, optionIndex].sort((a, b) => a - b);
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch(`/api/quizzes/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmittedAt(data.myResponse.updatedAt);
      setStatus("응답이 저장되었습니다. 언제든지 다시 제출하면 수정됩니다.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "제출에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  if (notFound) {
    return <p className="status">퀴즈를 찾을 수 없거나 아직 공개되지 않았습니다.</p>;
  }
  if (!quiz) {
    return null;
  }

  const answeredCount = answers.filter(
    (a) => a !== null && a !== "" && !(Array.isArray(a) && a.length === 0)
  ).length;

  return (
    <AuthGate auth={auth}>
      {quiz.intro && (
        <section className="guide">
          <Markdown text={quiz.intro} />
        </section>
      )}

      <form className="submissionForm quizForm" onSubmit={submit}>
        <div>
          <span className="label">진행 상황</span>
          <strong>
            {answeredCount} / {quiz.questions.length} 문항 응답
            {submittedAt &&
              ` · 마지막 제출 ${new Date(submittedAt).toLocaleString("ko-KR")}`}
          </strong>
          {!submittedAt && draftRestored && (
            <small className="quizHint" style={{ display: "block", marginTop: 6 }}>
              작성 중이던 답안을 이 브라우저에서 불러왔습니다. 아직 제출되지는 않았어요.
            </small>
          )}
          {!submittedAt && !draftRestored && (
            <small className="quizHint" style={{ display: "block", marginTop: 6 }}>
              작성한 답안은 이 브라우저에 자동 저장되어, 나갔다 와도 이어서 쓸 수 있습니다.
            </small>
          )}
        </div>

        {quiz.questions.map((question) => (
          <fieldset className="quizQuestion" key={question.index}>
            <legend>
              <span className="quizQuestionNumber">Q{question.index + 1}</span>
              {question.prompt}
            </legend>
            <Markdown text={question.body} />

            {question.type === "text" ? (
              <textarea
                placeholder="답변을 입력해 주세요."
                value={typeof answers[question.index] === "string" ? (answers[question.index] as string) : ""}
                onChange={(event) => setAnswer(question.index, event.target.value)}
              />
            ) : (
              <div className="quizOptions">
                {question.options.map((option, optionIndex) => {
                  const checked =
                    question.type === "single"
                      ? answers[question.index] === optionIndex
                      : Array.isArray(answers[question.index]) &&
                        (answers[question.index] as number[]).includes(optionIndex);
                  return (
                    <label className="quizOption" key={optionIndex}>
                      <input
                        type={question.type === "single" ? "radio" : "checkbox"}
                        name={`q-${question.index}`}
                        checked={checked}
                        onChange={() =>
                          question.type === "single"
                            ? setAnswer(question.index, optionIndex)
                            : toggleMultiple(question.index, optionIndex)
                        }
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
                {question.type === "multiple" && (
                  <small className="quizHint">복수 선택 문항입니다.</small>
                )}
              </div>
            )}
          </fieldset>
        ))}

        <button
          className="primaryButton wide"
          disabled={busy || answeredCount === 0}
          type="submit"
        >
          {submittedAt ? "응답 수정하기" : "응답 제출"}
        </button>
        {status && <p className="status">{status}</p>}
      </form>
    </AuthGate>
  );
}
