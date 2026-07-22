"use client";

import { useCallback, useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import Markdown from "@/components/quiz/Markdown";
import CommunityPanel from "@/components/quiz/CommunityPanel";
import PushToggle from "@/components/PushToggle";
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
  const [draftRestored, setDraftRestored] = useState(false);
  // 임시저장 로드가 끝나기 전에는 localStorage에 쓰지 않는다(빈 답으로 덮어쓰기 방지)
  const [ready, setReady] = useState(false);
  // 커뮤니티(문항 토론) 패널 상태
  const [openQ, setOpenQ] = useState<number | null>(null);
  const [counts, setCounts] = useState<Record<number, number>>({});
  // 문항별 제출 상태
  const [savingQ, setSavingQ] = useState<number | null>(null);
  const [savedQ, setSavedQ] = useState<number | null>(null);

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

  // 문항별 댓글 수(뱃지)를 불러온다
  useEffect(() => {
    if (!loggedIn) return;
    fetch(`/api/quizzes/${slug}/comments`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.counts) setCounts(data.counts);
      })
      .catch(() => {});
  }, [slug, loggedIn]);

  // 패널 열렸을 때 ESC로 닫기
  useEffect(() => {
    if (openQ === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenQ(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openQ]);

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

  // 문항 답을 사람이 읽을 텍스트로 (제출글 본문)
  function answerText(question: PublicQuizQuestion, ans: QuizAnswer): string {
    if (question.type === "text") return typeof ans === "string" ? ans.trim() : "";
    if (question.type === "single")
      return typeof ans === "number" ? question.options[ans] ?? "" : "";
    if (question.type === "multiple")
      return Array.isArray(ans)
        ? ans.map((i) => question.options[i]).filter(Boolean).join(", ")
        : "";
    return "";
  }

  async function refreshCounts() {
    const data = await fetch(`/api/quizzes/${slug}/comments`)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
    if (data?.counts) setCounts(data.counts);
  }

  // 문항 하나를 제출: 답안을 저장하고, 그 문항 토론에 최상위 글로 올린다
  async function submitQuestion(index: number) {
    const question = quiz!.questions[index];
    const text = answerText(question, answers[index]);
    if (!text) {
      setStatus(`Q${index + 1}에 먼저 답을 작성해 주세요.`);
      return;
    }
    setSavingQ(index);
    setStatus("");
    try {
      // 1) 답안 저장(기록용)
      const res = await fetch(`/api/quizzes/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmittedAt(data.myResponse.updatedAt);

      // 2) 제출 답을 그 문항 토론에 최상위 글로 등록
      const c = await fetch(`/api/quizzes/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIndex: index, body: text, isSubmission: true })
      });
      const cData = await c.json();
      if (!c.ok) throw new Error(cData.error);

      await refreshCounts();
      setSavedQ(index);
      window.setTimeout(() => setSavedQ((cur) => (cur === index ? null : cur)), 2500);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "제출에 실패했습니다.");
    } finally {
      setSavingQ(null);
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
    <div className="qcStage" data-open={openQ !== null}>
      <div className="qcMain">
    <AuthGate auth={auth}>
      {quiz.intro && (
        <section className="guide">
          <Markdown text={quiz.intro} />
        </section>
      )}

      <form className="submissionForm quizForm" onSubmit={(e) => e.preventDefault()}>
        <div>
          <span className="label">진행 상황</span>
          <strong>
            {answeredCount} / {quiz.questions.length} 문항 응답
            {submittedAt &&
              ` · 마지막 제출 ${new Date(submittedAt).toLocaleString("ko-KR")}`}
          </strong>
          <div style={{ marginTop: 10 }}>
            <PushToggle />
          </div>
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

            <div className="quizQuestionActions">
              <button
                type="button"
                className={`qcOpenBtn${openQ === question.index ? " isActive" : ""}`}
                onClick={() => setOpenQ(question.index)}
              >
                💬 이 문항 토론
                {counts[question.index] ? (
                  <span className="qcOpenCount">{counts[question.index]}</span>
                ) : null}
              </button>
              <button
                type="button"
                className="primaryButton quizSubmitBtn"
                disabled={savingQ !== null}
                onClick={() => submitQuestion(question.index)}
              >
                {savingQ === question.index
                  ? "제출 중…"
                  : savedQ === question.index
                    ? "제출됨 ✓"
                    : "제출"}
              </button>
            </div>
          </fieldset>
        ))}

        {status && <p className="status">{status}</p>}
      </form>
    </AuthGate>
      </div>

      <CommunityPanel
        slug={slug}
        questionIndex={openQ ?? 0}
        prompt={openQ !== null ? quiz.questions[openQ].prompt : ""}
        open={openQ !== null}
        onClose={() => setOpenQ(null)}
        onCountChange={(qi, c) => setCounts((prev) => ({ ...prev, [qi]: c }))}
      />
    </div>
  );
}
