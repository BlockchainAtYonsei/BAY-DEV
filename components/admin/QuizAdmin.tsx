"use client";

import { useState } from "react";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import AdminNavLinks from "@/components/admin/AdminNavLinks";
import QuizTable, { type QuizListItem } from "@/components/admin/quiz/QuizTable";
import QuizEditorPanel, {
  type QuizEditorState
} from "@/components/admin/quiz/QuizEditorPanel";
import ResponseMatrix, {
  type ResponsesData
} from "@/components/admin/quiz/ResponseMatrix";
import DiscussionPanel, {
  type DiscussionData
} from "@/components/admin/quiz/DiscussionPanel";
import { useAdminGate } from "@/hooks/useAdminGate";
import { useAsyncStatus } from "@/hooks/useAsyncStatus";
import { fetchJson } from "@/lib/client/http";

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

function emptyEditor(): QuizEditorState {
  return {
    id: null,
    slug: "",
    title: "",
    badge: "퀴즈 과제",
    track: "ethereum-core",
    markdown: SAMPLE_MARKDOWN,
    published: false
  };
}

function toEditorState(quiz: QuizListItem): QuizEditorState {
  return {
    id: quiz.id,
    slug: quiz.slug,
    title: quiz.title,
    badge: quiz.badge,
    track: quiz.track,
    markdown: quiz.markdown,
    published: quiz.published
  };
}

/** 퀴즈 관리 화면 — 데이터 로딩과 화면 전환만 조율한다 */
export default function QuizAdmin() {
  const { data: quizzes, authorized, reload } = useAdminGate<QuizListItem[]>(
    "/api/admin/quizzes",
    (data) => (data as { quizzes: QuizListItem[] }).quizzes,
    []
  );
  const { busy, status, run } = useAsyncStatus();
  const [editor, setEditor] = useState<QuizEditorState | null>(null);
  const [responsesFor, setResponsesFor] = useState<ResponsesData | null>(null);
  const [discussionFor, setDiscussionFor] = useState<DiscussionData | null>(null);

  function openEditor(quiz?: QuizListItem) {
    setResponsesFor(null);
    setDiscussionFor(null);
    setEditor(quiz ? toEditorState(quiz) : emptyEditor());
  }

  function saveEditor() {
    if (!editor) return;
    run(async () => {
      const isNew = !editor.id;
      await fetchJson(isNew ? "/api/admin/quizzes" : `/api/admin/quizzes/${editor.id}`, {
        method: isNew ? "POST" : "PUT",
        body: editor
      });
      setEditor(null);
      await reload();
      return isNew ? "퀴즈가 생성되었습니다." : "퀴즈가 수정되었습니다.";
    });
  }

  function togglePublished(quiz: QuizListItem) {
    run(async () => {
      await fetchJson(`/api/admin/quizzes/${quiz.id}`, {
        method: "PUT",
        body: { published: !quiz.published }
      });
      await reload();
    });
  }

  function removeQuiz(quiz: QuizListItem) {
    const ok = window.confirm(
      `"${quiz.title}" 퀴즈와 응답 ${quiz.responseCount}건을 모두 삭제할까요? 되돌릴 수 없습니다.`
    );
    if (!ok) return;
    run(async () => {
      await fetchJson(`/api/admin/quizzes/${quiz.id}`, { method: "DELETE" });
      await reload();
      return "퀴즈가 삭제되었습니다.";
    });
  }

  function openResponses(quiz: QuizListItem) {
    run(async () => {
      const data = await fetchJson<{
        quiz: ResponsesData["quiz"];
        parsed: { questions: ResponsesData["questions"] };
        responses: ResponsesData["responses"];
      }>(`/api/admin/quizzes/${quiz.id}`);
      setResponsesFor({
        quiz: data.quiz,
        questions: data.parsed.questions,
        responses: data.responses
      });
      setDiscussionFor(null);
      setEditor(null);
    });
  }

  function openDiscussion(quiz: QuizListItem) {
    run(async () => {
      const data = await fetchJson<DiscussionData>(`/api/admin/quizzes/${quiz.id}/comments`);
      setDiscussionFor(data);
      setResponsesFor(null);
      setEditor(null);
    });
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
          <AdminNavLinks current="/admin/quizzes" />
          <button className="primaryButton" type="button" onClick={() => openEditor()}>
            새 퀴즈 만들기
          </button>
        </div>
      </section>

      {status && <p className="status">{status}</p>}

      <QuizTable
        quizzes={quizzes}
        busy={busy}
        onEdit={openEditor}
        onResponses={openResponses}
        onDiscussion={openDiscussion}
        onTogglePublished={togglePublished}
        onRemove={removeQuiz}
      />

      {editor && (
        <QuizEditorPanel
          editor={editor}
          busy={busy}
          onChange={setEditor}
          onSave={saveEditor}
          onClose={() => setEditor(null)}
        />
      )}

      {responsesFor && (
        <ResponseMatrix data={responsesFor} onClose={() => setResponsesFor(null)} />
      )}

      {discussionFor && (
        <DiscussionPanel data={discussionFor} onClose={() => setDiscussionFor(null)} />
      )}
    </main>
  );
}
