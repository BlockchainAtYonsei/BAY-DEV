"use client";

import { useMemo } from "react";
import LectureView from "@/components/lecture/LectureView";
import { parseLecture } from "@/lib/lecture/parse";
import { isHtmlFileName, slugFromFileName } from "@/lib/client/file";
import { TRACKS } from "@/lib/tracks";

export type LectureEditorState = {
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

type Props = {
  editor: LectureEditorState;
  busy: boolean;
  onChange: (next: LectureEditorState) => void;
  onSave: () => void;
  onClose: () => void;
};

/** 학습자료 작성/수정 폼 + 실시간 미리보기 (마크다운/HTML 겸용) */
export default function LectureEditorPanel({ editor, busy, onChange, onSave, onClose }: Props) {
  const preview = useMemo(() => parseLecture(editor.markdown), [editor.markdown]);

  async function loadFile(file: File) {
    const text = await file.text();
    onChange({
      ...editor,
      markdown: text,
      format: isHtmlFileName(file.name) ? "html" : editor.format,
      slug: editor.slug || slugFromFileName(file.name)
    });
  }

  return (
    <section className="quizEditor">
      <h2 className="sectionTitle">{editor.id ? "학습자료 편집" : "새 학습자료"}</h2>
      <div className="quizEditorGrid">
        <div className="submissionForm">
          <label>
            md/html 파일 업로드 (내용을 아래 편집기로 불러옵니다)
            <input
              type="file"
              accept=".md,.markdown,.html,.htm,text/markdown,text/plain,text/html"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) await loadFile(file);
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
                onChange({ ...editor, slug: event.target.value.toLowerCase() })
              }
            />
          </label>
          <label>
            제목 (비우면 마크다운의 # 제목 사용)
            <input
              value={editor.title}
              placeholder={preview.title || "강의 제목"}
              onChange={(event) => onChange({ ...editor, title: event.target.value })}
            />
          </label>
          <label>
            배지
            <input
              value={editor.badge}
              onChange={(event) => onChange({ ...editor, badge: event.target.value })}
            />
          </label>
          <label>
            회차 (정렬 순서)
            <input
              type="number"
              min={0}
              value={editor.order}
              onChange={(event) =>
                onChange({ ...editor, order: Number(event.target.value) || 0 })
              }
            />
          </label>
          <label>
            트랙
            <select
              value={editor.track}
              onChange={(event) => onChange({ ...editor, track: event.target.value })}
            >
              {TRACKS.map((track) => (
                <option key={track.slug} value={track.slug}>
                  {track.title}
                </option>
              ))}
              <option value="">목록 미노출 (임베드 전용)</option>
            </select>
          </label>
          <label>
            형식
            <select
              value={editor.format}
              onChange={(event) =>
                onChange({
                  ...editor,
                  format: event.target.value === "html" ? "html" : "markdown"
                })
              }
            >
              <option value="markdown">마크다운 학습자료</option>
              <option value="html">HTML 인터랙티브 자료</option>
            </select>
          </label>
          <label>
            {editor.format === "html" ? "HTML 원문" : "학습자료 마크다운"}
            <textarea
              className="quizMarkdownInput"
              value={editor.markdown}
              onChange={(event) => onChange({ ...editor, markdown: event.target.value })}
            />
          </label>
          <label className="quizCheckbox">
            <input
              type="checkbox"
              checked={editor.published}
              onChange={(event) => onChange({ ...editor, published: event.target.checked })}
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
              onClick={onSave}
            >
              저장
            </button>
            <button className="ghostButton" type="button" onClick={onClose}>
              닫기
            </button>
          </div>
          <p className="formGuide">
            형식: <code># 제목</code> · 섹션은 <code>## 제목</code>, 섹션 라벨은{" "}
            <code>:라벨 개념 ①</code> · 블록은 <code>:::cards</code> <code>:::flow</code>{" "}
            <code>:::steps</code> <code>:::compare</code> <code>:::callout</code>{" "}
            <code>:::embed</code>(URL 한 줄) ~ <code>:::</code>, 블록 안 항목은{" "}
            <code>### 제목</code>으로 나눕니다.
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
  );
}
