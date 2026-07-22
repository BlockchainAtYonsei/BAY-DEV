"use client";

import Markdown from "@/components/quiz/Markdown";
import type { PublicQuizQuestion, QuizAnswer } from "@/lib/quiz/parse";

type Props = {
  question: PublicQuizQuestion;
  answer: QuizAnswer;
  commentCount: number;
  discussionOpen: boolean;
  submitState: "idle" | "saving" | "saved";
  submitDisabled: boolean;
  onAnswer: (value: QuizAnswer) => void;
  onToggleOption: (optionIndex: number) => void;
  onOpenDiscussion: () => void;
  onSubmit: () => void;
};

function AnswerInput({
  question,
  answer,
  onAnswer,
  onToggleOption
}: Pick<Props, "question" | "answer" | "onAnswer" | "onToggleOption">) {
  if (question.type === "text") {
    return (
      <textarea
        placeholder="답변을 입력해 주세요."
        value={typeof answer === "string" ? answer : ""}
        onChange={(event) => onAnswer(event.target.value)}
      />
    );
  }
  return (
    <div className="quizOptions">
      {question.options.map((option, optionIndex) => {
        const checked =
          question.type === "single"
            ? answer === optionIndex
            : Array.isArray(answer) && answer.includes(optionIndex);
        return (
          <label className="quizOption" key={optionIndex}>
            <input
              type={question.type === "single" ? "radio" : "checkbox"}
              name={`q-${question.index}`}
              checked={checked}
              onChange={() =>
                question.type === "single" ? onAnswer(optionIndex) : onToggleOption(optionIndex)
              }
            />
            <span>{option}</span>
          </label>
        );
      })}
      {question.type === "multiple" && <small className="quizHint">복수 선택 문항입니다.</small>}
    </div>
  );
}

/** 문항 하나: 질문 표시 + 답 입력 + 토론/제출 액션 */
export default function QuestionCard({
  question,
  answer,
  commentCount,
  discussionOpen,
  submitState,
  submitDisabled,
  onAnswer,
  onToggleOption,
  onOpenDiscussion,
  onSubmit
}: Props) {
  return (
    <fieldset className="quizQuestion">
      <legend>
        <span className="quizQuestionNumber">Q{question.index + 1}</span>
        {question.prompt}
      </legend>
      <Markdown text={question.body} />
      <AnswerInput
        question={question}
        answer={answer}
        onAnswer={onAnswer}
        onToggleOption={onToggleOption}
      />
      <div className="quizQuestionActions">
        <button
          type="button"
          className={`qcOpenBtn${discussionOpen ? " isActive" : ""}`}
          onClick={onOpenDiscussion}
        >
          💬 이 문항 토론
          {commentCount ? <span className="qcOpenCount">{commentCount}</span> : null}
        </button>
        <button
          type="button"
          className="primaryButton quizSubmitBtn"
          disabled={submitDisabled}
          onClick={onSubmit}
        >
          {submitState === "saving" ? "제출 중…" : submitState === "saved" ? "제출됨 ✓" : "제출"}
        </button>
      </div>
    </fieldset>
  );
}
