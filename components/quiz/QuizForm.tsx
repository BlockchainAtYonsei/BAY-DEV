"use client";

import { useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import Markdown from "@/components/quiz/Markdown";
import CommunityPanel from "@/components/quiz/CommunityPanel";
import QuestionCard from "@/components/quiz/QuestionCard";
import QuizProgress from "@/components/quiz/QuizProgress";
import { useSession } from "@/hooks/useSession";
import { useQuizAnswers } from "@/hooks/useQuizAnswers";
import { useQuestionComments } from "@/hooks/useQuestionComments";
import { postSubmissionComment, saveQuizAnswers } from "@/lib/client/quizApi";
import { answerText } from "@/lib/quiz/answerText";

type Props = {
  slug: string;
};

/** 퀴즈 풀이 화면 — 상태 훅과 하위 컴포넌트를 조율한다 */
export default function QuizForm({ slug }: Props) {
  const auth = useSession();
  const loggedIn = Boolean(auth.session?.name);
  const wallet = auth.session?.wallet || null;

  const {
    quiz,
    notFound,
    answers,
    setAnswer,
    toggleMultiple,
    submittedAt,
    setSubmittedAt,
    draftRestored,
    answeredCount
  } = useQuizAnswers(slug, wallet, loggedIn);
  const { counts, refresh: refreshCounts, setCount } = useQuestionComments(slug, loggedIn);

  const [status, setStatus] = useState("");
  const [openQ, setOpenQ] = useState<number | null>(null);
  const [savingQ, setSavingQ] = useState<number | null>(null);
  const [savedQ, setSavedQ] = useState<number | null>(null);

  // 토론 패널이 열렸을 때 ESC로 닫기
  useEffect(() => {
    if (openQ === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenQ(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openQ]);

  // 저장 완료 표시를 잠시 보여줬다가 되돌린다
  function flashSaved(index: number) {
    setSavedQ(index);
    window.setTimeout(() => setSavedQ((cur) => (cur === index ? null : cur)), 2500);
  }

  // 문항 하나를 제출하는 절차를 조율: 답안 저장 → 토론 게시 → 뱃지 갱신
  async function submitQuestion(index: number) {
    if (!quiz) return;
    const text = answerText(quiz.questions[index], answers[index]);
    if (!text) {
      setStatus(`Q${index + 1}에 먼저 답을 작성해 주세요.`);
      return;
    }
    setSavingQ(index);
    setStatus("");
    try {
      setSubmittedAt(await saveQuizAnswers(slug, answers));
      await postSubmissionComment(slug, index, text);
      await refreshCounts();
      flashSaved(index);
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
            <QuizProgress
              answeredCount={answeredCount}
              total={quiz.questions.length}
              submittedAt={submittedAt}
              draftRestored={draftRestored}
            />

            {quiz.questions.map((question) => (
              <QuestionCard
                key={question.index}
                question={question}
                answer={answers[question.index]}
                commentCount={counts[question.index] || 0}
                discussionOpen={openQ === question.index}
                submitState={
                  savingQ === question.index
                    ? "saving"
                    : savedQ === question.index
                      ? "saved"
                      : "idle"
                }
                submitDisabled={savingQ !== null}
                onAnswer={(value) => setAnswer(question.index, value)}
                onToggleOption={(optionIndex) => toggleMultiple(question.index, optionIndex)}
                onOpenDiscussion={() => setOpenQ(question.index)}
                onSubmit={() => submitQuestion(question.index)}
              />
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
        onCountChange={setCount}
      />
    </div>
  );
}
