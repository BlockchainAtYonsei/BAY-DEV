"use client";

import { useState } from "react";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import AdminNavLinks from "@/components/admin/AdminNavLinks";
import LectureTable from "@/components/admin/lecture/LectureTable";
import LectureEditorPanel, {
  type LectureEditorState
} from "@/components/admin/lecture/LectureEditorPanel";
import { useAdminGate } from "@/hooks/useAdminGate";
import { useAsyncStatus } from "@/hooks/useAsyncStatus";
import { fetchJson } from "@/lib/client/http";
import type { Lecture } from "@/lib/lectureStore";

const SAMPLE_MARKDOWN = `# 강의 제목

인트로 문단입니다. 첫 \`##\` 이전 내용이 상단에 표시됩니다.

## 첫 번째 섹션
:라벨 개념 ①

일반 마크다운 문단. 코드펜스도 쓸 수 있습니다.

:::cards
### 카드 제목
카드 내용
### 카드 제목 2
카드 내용
:::

## 흐름 예시
:::flow
### 1단계
설명
### 2단계
설명
:::

:::callout
강조하고 싶은 문장은 콜아웃으로.
:::
`;

function emptyEditor(): LectureEditorState {
  return {
    id: null,
    slug: "",
    title: "",
    badge: "학습자료",
    track: "ethereum-core",
    order: 1,
    format: "markdown",
    markdown: SAMPLE_MARKDOWN,
    published: false
  };
}

function toEditorState(lecture: Lecture): LectureEditorState {
  return {
    id: lecture.id,
    slug: lecture.slug,
    title: lecture.title,
    badge: lecture.badge,
    track: lecture.track,
    order: lecture.order,
    format: lecture.format === "html" ? "html" : "markdown",
    markdown: lecture.markdown,
    published: lecture.published
  };
}

/** 학습자료 관리 화면 — 데이터 로딩과 화면 전환만 조율한다 */
export default function LectureAdmin() {
  const { data: lectures, authorized, reload } = useAdminGate<Lecture[]>(
    "/api/admin/lectures",
    (data) => (data as { lectures: Lecture[] }).lectures,
    []
  );
  const { busy, status, run } = useAsyncStatus();
  const [editor, setEditor] = useState<LectureEditorState | null>(null);

  function openEditor(lecture?: Lecture) {
    setEditor(lecture ? toEditorState(lecture) : emptyEditor());
  }

  function saveEditor() {
    if (!editor) return;
    run(async () => {
      const isNew = !editor.id;
      await fetchJson(isNew ? "/api/admin/lectures" : `/api/admin/lectures/${editor.id}`, {
        method: isNew ? "POST" : "PUT",
        body: editor
      });
      setEditor(null);
      await reload();
      return isNew ? "학습자료가 생성되었습니다." : "학습자료가 수정되었습니다.";
    });
  }

  function togglePublished(lecture: Lecture) {
    run(async () => {
      await fetchJson(`/api/admin/lectures/${lecture.id}`, {
        method: "PUT",
        body: { published: !lecture.published }
      });
      await reload();
    });
  }

  function removeLecture(lecture: Lecture) {
    if (!window.confirm(`"${lecture.title}" 학습자료를 삭제할까요? 되돌릴 수 없습니다.`)) return;
    run(async () => {
      await fetchJson(`/api/admin/lectures/${lecture.id}`, { method: "DELETE" });
      await reload();
      return "학습자료가 삭제되었습니다.";
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
        <h1>학습자료 관리</h1>
        <div className="adminActions">
          <AdminNavLinks current="/admin/lectures" />
          <button className="primaryButton" type="button" onClick={() => openEditor()}>
            새 학습자료 만들기
          </button>
        </div>
      </section>

      {status && <p className="status">{status}</p>}

      <LectureTable
        lectures={lectures}
        busy={busy}
        onEdit={openEditor}
        onTogglePublished={togglePublished}
        onRemove={removeLecture}
      />

      {editor && (
        <LectureEditorPanel
          editor={editor}
          busy={busy}
          onChange={setEditor}
          onSave={saveEditor}
          onClose={() => setEditor(null)}
        />
      )}
    </main>
  );
}
