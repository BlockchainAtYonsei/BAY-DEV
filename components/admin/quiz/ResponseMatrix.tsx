"use client";

import type { QuizAnswer, QuizQuestion } from "@/lib/quiz/parse";
import type { Quiz, QuizResponse } from "@/lib/quizStore";

export type ResponsesData = {
  quiz: Quiz;
  questions: QuizQuestion[];
  responses: QuizResponse[];
};

/** 응답 하나를 표시 텍스트 + 정오 여부로 변환 (주관식·미채점은 correct=null) */
function formatAnswer(question: QuizQuestion, answer: QuizAnswer | undefined) {
  if (answer === null || answer === undefined) return { text: "—", correct: null };
  if (question.type === "text") {
    const text = typeof answer === "string" ? answer : "—";
    return { text: text.trim() || "—", correct: null };
  }
  if (question.type === "single") {
    if (typeof answer !== "number") return { text: "—", correct: null };
    return {
      text: question.options[answer] ?? "—",
      correct: question.correct.length ? question.correct[0] === answer : null
    };
  }
  if (!Array.isArray(answer) || answer.length === 0) return { text: "—", correct: null };
  const picked = answer.filter((v): v is number => typeof v === "number");
  const expected = [...question.correct].sort();
  const sorted = [...picked].sort();
  return {
    text: picked.map((v) => question.options[v] ?? "?").join(", "),
    correct:
      question.correct.length === 0
        ? null
        : sorted.length === expected.length && sorted.every((v, i) => v === expected[i])
  };
}

function AnswerCell({
  question,
  answer
}: {
  question: QuizQuestion;
  answer: QuizAnswer | undefined;
}) {
  const cell = formatAnswer(question, answer);
  return (
    <td className={cell.correct === null ? undefined : cell.correct ? "cellOk" : "cellMiss"}>
      {cell.text}
    </td>
  );
}

/** 퀴즈 하나의 사람별 응답 매트릭스 */
export default function ResponseMatrix({
  data,
  onClose
}: {
  data: ResponsesData;
  onClose: () => void;
}) {
  const { quiz, questions, responses } = data;
  return (
    <section className="quizEditor">
      <div className="adminHeader">
        <h2 className="sectionTitle">
          응답 — {quiz.title} ({responses.length}명)
        </h2>
        <button className="ghostButton" type="button" onClick={onClose}>
          닫기
        </button>
      </div>
      {responses.length === 0 ? (
        <p className="status">아직 제출된 응답이 없습니다.</p>
      ) : (
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>이름</th>
                <th>점수</th>
                {questions.map((question) => (
                  <th key={question.index} title={question.prompt}>
                    Q{question.index + 1}
                  </th>
                ))}
                <th>제출 시각</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((response) => (
                <tr key={response.id}>
                  <td>
                    {response.name}
                    <br />
                    <small className="urlCell">{response.wallet}</small>
                  </td>
                  <td>{response.total > 0 ? `${response.score} / ${response.total}` : "—"}</td>
                  {questions.map((question) => (
                    <AnswerCell
                      key={question.index}
                      question={question}
                      answer={response.answers[question.index]}
                    />
                  ))}
                  <td>{new Date(response.updatedAt).toLocaleString("ko-KR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
