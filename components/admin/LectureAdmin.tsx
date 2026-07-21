"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import LectureView from "@/components/lecture/LectureView";
import { parseLecture } from "@/lib/lecture/parse";
import type { Lecture } from "@/lib/lectureStore";
import { TRACKS, findTrack } from "@/lib/tracks";

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

type EditorState = {
  id: string | null;
  slug: string;
  title: string;
  badge: string;
  track: string;
  order: number;
  format: "markdown" | "html";
  markdown: string;
  published: boolean;
};

function emptyEditor(): EditorState {
  return {
    id: null,
    slug: "",
    title: "",
    badge: "강의록",
    track: "ethereum-core",
    order: 1,
    format: "markdown",
    markdown: SAMPLE_MARKDOWN,
    published: false
  };
}

export default function LectureAdmin() {
  const [authorized, setAuthorized] = useState(false);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetch("/api/admin/lectures");
    if (!res.ok) {
      setAuthorized(false);
      return;
    }
    const data = await res.json();
    setLectures(data.lectures);
    setAuthorized(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const preview = useMemo(
    () => (editor ? parseLecture(editor.markdown) : null),
    [editor]
  );

  async function saveEditor() {
    if (!editor) return;
    setBusy(true);
    setStatus("");
    try {
      const isNew = !editor.id;
      const res = await fetch(
        isNew ? "/api/admin/lectures" : `/api/admin/lectures/${editor.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: editor.slug,
            title: editor.title,
            badge: editor.badge,
            track: editor.track,
            order: editor.order,
            format: editor.format,
            markdown: editor.markdown,
            published: editor.published
          })
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(isNew ? "강의록이 생성되었습니다." : "강의록이 수정되었습니다.");
      setEditor(null);
      await reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublished(lecture: Lecture) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/lectures/${lecture.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !lecture.published })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "변경에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function removeLecture(lecture: Lecture) {
    if (!window.confirm(`"${lecture.title}" 강의록을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/lectures/${lecture.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setStatus("강의록이 삭제되었습니다.");
      await reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "삭제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  function openEditor(lecture?: Lecture) {
    setStatus("");
    setEditor(
      lecture
        ? {
            id: lecture.id,
            slug: lecture.slug,
            title: lecture.title,
            badge: lecture.badge,
            track: lecture.track,
            order: lecture.order,
            format: lecture.format === "html" ? "html" : "markdown",
            markdown: lecture.markdown,
            published: lecture.published
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
        <h1>강의록 관리</h1>
        <div className="adminActions">
          <Link className="ghostButton" href="/admin">
            제출 현황
          </Link>
          <Link className="ghostButton" href="/admin/quizzes">
            퀴즈 관리
          </Link>
          <button className="primaryButton" type="button" onClick={() => openEditor()}>
            새 강의록 만들기
          </button>
        </div>
      </section>

      {status && <p className="status">{status}</p>}

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>회차</th>
              <th>제목</th>
              <th>slug</th>
              <th>트랙</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {lectures.length === 0 && (
              <tr>
                <td colSpan={6}>아직 강의록이 없습니다. 새 강의록을 만들어 보세요.</td>
              </tr>
            )}
            {lectures.map((lecture) => (
              <tr key={lecture.id}>
                <td>{lecture.order}</td>
                <td>{lecture.title}</td>
                <td>
                  {lecture.published ? (
                    <Link href={`/lecture/${lecture.slug}`} target="_blank">
                      {lecture.slug}
                    </Link>
                  ) : (
                    lecture.slug
                  )}
                </td>
                <td>
                  {findTrack(lecture.track)?.title || "홈 단독"}
                  {lecture.format === "html" ? " · 인터랙티브" : ""}
                </td>
                <td>{lecture.published ? "게시됨" : "비공개"}</td>
                <td className="quizRowActions">
                  <button className="ghostButton" type="button" onClick={() => openEditor(lecture)}>
                    편집
                  </button>
                  <button
                    className="ghostButton"
                    type="button"
                    disabled={busy}
                    onClick={() => togglePublished(lecture)}
                  >
                    {lecture.published ? "숨기기" : "게시"}
                  </button>
                  <button
                    className="ghostButton"
                    type="button"
                    disabled={busy}
                    onClick={() => removeLecture(lecture)}
                  >
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
          <h2 className="sectionTitle">{editor.id ? "강의록 편집" : "새 강의록"}</h2>
          <div className="quizEditorGrid">
            <div className="submissionForm">
              <label>
                md 파일 업로드 (내용을 아래 편집기로 불러옵니다)
                <input
                  type="file"
                  accept=".md,.markdown,.html,.htm,text/markdown,text/plain,text/html"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const text = await file.text();
                    setEditor((prev) => {
                      if (!prev) return prev;
                      const isHtml = /\.(html?|htm)$/i.test(file.name);
                      const fromName = file.name
                        .replace(/\.(md|markdown|txt|html?|htm)$/i, "")
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-+|-+$/g, "")
                        .slice(0, 64);
                      return {
                        ...prev,
                        markdown: text,
                        format: isHtml ? "html" : prev.format,
                        slug: prev.slug || fromName
                      };
                    });
                    event.target.value = "";
                  }}
                />
              </label>
              <label>
                slug (URL 주소, 예: lecture-1)
                <input
                  value={editor.slug}
                  placeholder="lecture-1"
                  onChange={(event) =>
                    setEditor({ ...editor, slug: event.target.value.toLowerCase() })
                  }
                />
              </label>
              <label>
                제목 (비우면 마크다운의 # 제목 사용)
                <input
                  value={editor.title}
                  placeholder={preview.title || "강의 제목"}
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
                회차 (정렬 순서)
                <input
                  type="number"
                  min={0}
                  value={editor.order}
                  onChange={(event) =>
                    setEditor({ ...editor, order: Number(event.target.value) || 0 })
                  }
                />
              </label>
              <label>
                트랙 (강의록이 노출될 과제)
                <select
                  value={editor.track}
                  onChange={(event) => setEditor({ ...editor, track: event.target.value })}
                >
                  {TRACKS.map((track) => (
                    <option key={track.slug} value={track.slug}>
                      {track.title}
                    </option>
                  ))}
                  <option value="">홈 화면 단독 노출</option>
                </select>
              </label>
              <label>
                형식
                <select
                  value={editor.format}
                  onChange={(event) =>
                    setEditor({
                      ...editor,
                      format: event.target.value === "html" ? "html" : "markdown"
                    })
                  }
                >
                  <option value="markdown">마크다운 강의록</option>
                  <option value="html">HTML 인터랙티브 자료</option>
                </select>
              </label>
              <label>
                {editor.format === "html" ? "HTML 원문" : "강의록 마크다운"}
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
                  disabled={
                    busy ||
                    !editor.slug ||
                    (editor.format === "markdown" && preview.sections.length === 0)
                  }
                  onClick={saveEditor}
                >
                  저장
                </button>
                <button className="ghostButton" type="button" onClick={() => setEditor(null)}>
                  닫기
                </button>
              </div>
              <p className="formGuide">
                형식: <code># 제목</code> · 섹션은 <code>## 제목</code>, 섹션 라벨은{" "}
                <code>:라벨 개념 ①</code> · 블록은 <code>:::cards</code> <code>:::flow</code>{" "}
                <code>:::steps</code> <code>:::compare</code> <code>:::callout</code> ~{" "}
                <code>:::</code>, 블록 안 항목은 <code>### 제목</code>으로 나눕니다.
              </p>
            </div>

            <div className="quizPreview">
              <h3>미리보기 — {preview.title || editor.title || editor.slug}</h3>
              {editor.format === "html" ? (
                <iframe
                  className="lecturePreviewFrame"
                  srcDoc={editor.markdown}
                  title="HTML 미리보기"
                />
              ) : (
                <LectureView lecture={preview} />
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
