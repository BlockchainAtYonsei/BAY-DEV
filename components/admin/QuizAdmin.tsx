"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import Markdown from "@/components/quiz/Markdown";
import { parseQuiz, type QuizAnswer, type QuizQuestion } from "@/lib/quiz/parse";
import type { Quiz, QuizResponse } from "@/lib/quizStore";

type QuizListItem = Quiz & { questionCount: number; responseCount: number };

const SAMPLE_MARKDOWN = `# 이더리움 기초 퀴즈

이더리움 핵심 개념을 확인하는 퀴즈입니다. 모든 문항에 응답 후 제출해 주세요.

## 이더리움의 현재 합의 알고리즘은 무엇인가요?
- [ ] Proof of Work
- [x] Proof of Stake
- [ ] Proof of Authority

## EVM에서 상태를 변경하는 연산에 가스비가 필요한 이유를 서술해 주세요.
자유롭게 서술형으로 답변해 주세요.

## 다음 중 이더리움 트랜잭션에 포함되는 필드를 모두 고르세요.
- [x] nonce
- [x] gasLimit
- [ ] blockHash
- [x] value
`;

type EditorState = {
  id: string | null;
  slug: string;
  title: string;
  badge: string;
  markdown: string;
  published: boolean;
};

function emptyEditor(): EditorState {
  return {
    id: null,
    slug: "",
    title: "",
    badge: "퀴즈 과제",
    markdown: SAMPLE_MARKDOWN,
    published: false
  };
}

export default function QuizAdmin() {
  const [authorized, setAuthorized] = useState(false);
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [responsesFor, setResponsesFor] = useState<{
    quiz: Quiz;
    questions: QuizQuestion[];
    responses: QuizResponse[];
  } | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetch("/api/admin/quizzes");
    if (!res.ok) {
      setAuthorized(false);
      return;
    }
    const data = await res.json();
    setQuizzes(data.quizzes);
    setAuthorized(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const preview = useMemo(
    () => (editor ? parseQuiz(editor.markdown) : null),
    [editor]
  );

  async function saveEditor() {
    if (!editor) return;
    setBusy(true);
    setStatus("");
    try {
      const isNew = !editor.id;
      const res = await fetch(
        isNew ? "/api/admin/quizzes" : `/api/admin/quizzes/${editor.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: editor.slug,
            title: editor.title,
            badge: editor.badge,
            markdown: editor.markdown,
            published: editor.published
          })
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(isNew ? "퀴즈가 생성되었습니다." : "퀴즈가 수정되었습니다.");
      setEditor(null);
      await reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function patchQuiz(id: string, patch: Partial<Pick<Quiz, "published">>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "변경에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function removeQuiz(quiz: QuizListItem) {
    const ok = window.confirm(
      `"${quiz.title}" 퀴즈와 응답 ${quiz.responseCount}건을 모두 삭제할까요? 되돌릴 수 없습니다.`
    );
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${quiz.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setStatus("퀴즈가 삭제되었습니다.");
      await reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "삭제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function openResponses(quiz: QuizListItem) {
    const res = await fetch(`/api/admin/quizzes/${quiz.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setResponsesFor({
      quiz: data.quiz,
      questions: data.parsed.questions,
      responses: data.responses
    });
    setEditor(null);
  }

  function openEditor(quiz?: QuizListItem) {
    setResponsesFor(null);
    setStatus("");
    setEditor(
      quiz
        ? {
            id: quiz.id,
            slug: quiz.slug,
            title: quiz.title,
            badge: quiz.badge,
            markdown: quiz.markdown,
            published: quiz.published
          }
        : emptyEditor()
    );
  }

  if (!authorized) {
    return (
      <main className="adminShell">
        <AdminLoginForm onSuccess={reload} />
      </main>
    );
  }

  return (
    <main className="adminShell">
      <section className="adminHeader">
        <h1>퀴즈 관리</h1>
        <div className="adminActions">
          <Link className="ghostButton" href="/admin">
            제출 현황
          </Link>
          <button className="primaryButton" type="button" onClick={() => openEditor()}>
            새 퀴즈 만들기
          </button>
        </div>
      </section>

      {status && <p className="status">{status}</p>}

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>제목</th>
              <th>slug</th>
              <th>문항</th>
              <th>응답</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.length === 0 && (
              <tr>
                <td colSpan={6}>아직 퀴즈가 없습니다. 새 퀴즈를 만들어 보세요.</td>
              </tr>
            )}
            {quizzes.map((quiz) => (
              <tr key={quiz.id}>
                <td>{quiz.title}</td>
                <td>
                  {quiz.published ? (
                    <Link href={`/quiz/${quiz.slug}`} target="_blank">
                      {quiz.slug}
                    </Link>
                  ) : (
                    quiz.slug
                  )}
                </td>
                <td>{quiz.questionCount}</td>
                <td>{quiz.responseCount}</td>
                <td>{quiz.published ? "게시됨" : "비공개"}</td>
                <td className="quizRowActions">
                  <button className="ghostButton" type="button" onClick={() => openEditor(quiz)}>
                    편집
                  </button>
                  <button className="ghostButton" type="button" onClick={() => openResponses(quiz)}>
                    응답 보기
                  </button>
                  <button
                    className="ghostButton"
                    type="button"
                    disabled={busy}
                    onClick={() => patchQuiz(quiz.id, { published: !quiz.published })}
                  >
                    {quiz.published ? "숨기기" : "게시"}
                  </button>
                  <button className="ghostButton" type="button" disabled={busy} onClick={() => removeQuiz(quiz)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editor && preview && (
        <section className="quizEditor">
          <h2 className="sectionTitle">{editor.id ? "퀴즈 편집" : "새 퀴즈"}</h2>
          <div className="quizEditorGrid">
            <div className="submissionForm">
              <label>
                slug (URL 주소, 예: eth-week1)
                <input
                  value={editor.slug}
                  placeholder="eth-week1"
                  onChange={(event) =>
                    setEditor({ ...editor, slug: event.target.value.toLowerCase() })
                  }
                />
              </label>
              <label>
                제목 (비우면 마크다운의 # 제목 사용)
                <input
                  value={editor.title}
                  placeholder={preview.title || "퀴즈 제목"}
                  onChange={(event) => setEditor({ ...editor, title: event.target.value })}
                />
              </label>
              <label>
                배지
                <input
                  value={editor.badge}
                  onChange={(event) => setEditor({ ...editor, badge: event.target.value })}
                />
              </label>
              <label>
                퀴즈 마크다운
                <textarea
                  className="quizMarkdownInput"
                  value={editor.markdown}
                  onChange={(event) => setEditor({ ...editor, markdown: event.target.value })}
                />
              </label>
              <label className="quizCheckbox">
                <input
                  type="checkbox"
                  checked={editor.published}
                  onChange={(event) => setEditor({ ...editor, published: event.target.checked })}
                />
                바로 게시하기
              </label>
              <div className="quizRowActions">
                <button
                  className="primaryButton"
                  type="button"
                  disabled={busy || !editor.slug || preview.questions.length === 0}
                  onClick={saveEditor}
                >
                  저장
                </button>
                <button className="ghostButton" type="button" onClick={() => setEditor(null)}>
                  닫기
                </button>
              </div>
              <p className="formGuide">
                형식: <code># 제목</code> · 문항은 <code>## 질문</code> · 보기는{" "}
                <code>- [ ] 오답</code> / <code>- [x] 정답</code> · 보기가 없으면 주관식.{" "}
                <code>[x]</code>가 2개 이상이면 복수 선택 문항이 됩니다. 정답 표시는 학생에게
                보이지 않습니다.
              </p>
            </div>

            <div className="quizPreview">
              <h3>미리보기 — {preview.title || editor.title || editor.slug}</h3>
              <Markdown text={preview.intro} />
              {preview.questions.map((question) => (
                <div className="quizQuestion" key={question.index}>
                  <p>
                    <span className="quizQuestionNumber">Q{question.index + 1}</span>
                    <strong>{question.prompt}</strong>{" "}
                    <small className="quizHint">
                      {question.type === "text"
                        ? "주관식"
                        : question.type === "multiple"
                          ? "복수 선택"
                          : "단일 선택"}
                    </small>
                  </p>
                  <Markdown text={question.body} />
                  <ul className="quizPreviewOptions">
                    {question.options.map((option, optionIndex) => (
                      <li
                        key={optionIndex}
                        className={question.correct.includes(optionIndex) ? "cellOk" : undefined}
                      >
                        {option}
                        {question.correct.includes(optionIndex) ? " ✓ 정답" : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {responsesFor && (
        <ResponseMatrix
          data={responsesFor}
          onClose={() => setResponsesFor(null)}
        />
      )}
    </main>
  );
}

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

function ResponseMatrix({
  data,
  onClose
}: {
  data: { quiz: Quiz; questions: QuizQuestion[]; responses: QuizResponse[] };
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
                  <td>
                    {response.total > 0 ? `${response.score} / ${response.total}` : "—"}
                  </td>
                  {questions.map((question) => {
                    const cell = formatAnswer(question, response.answers[question.index]);
                    return (
                      <td
                        key={question.index}
                        className={
                          cell.correct === null ? undefined : cell.correct ? "cellOk" : "cellMiss"
                        }
                      >
                        {cell.text}
                      </td>
                    );
                  })}
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
