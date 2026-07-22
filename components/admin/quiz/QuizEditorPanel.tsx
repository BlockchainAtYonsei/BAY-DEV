"use client";

import { useMemo } from "react";
import Markdown from "@/components/quiz/Markdown";
import { parseQuiz } from "@/lib/quiz/parse";
import { slugFromFileName } from "@/lib/client/file";
import { TRACKS } from "@/lib/tracks";

export type QuizEditorState = {
  id: string | null;
  slug: string;
  title: string;
  badge: string;
  track: string;
  markdown: string;
  published: boolean;
};

type Props = {
  editor: QuizEditorState;
  busy: boolean;
  onChange: (next: QuizEditorState) => void;
  onSave: () => void;
  onClose: () => void;
};

/** 퀴즈 작성/수정 폼 + 실시간 미리보기 */
export default function QuizEditorPanel({ editor, busy, onChange, onSave, onClose }: Props) {
  const preview = useMemo(() => parseQuiz(editor.markdown), [editor.markdown]);

  async function loadFile(file: File) {
    const text = await file.text();
    onChange({ ...editor, markdown: text, slug: editor.slug || slugFromFileName(file.name) });
  }

  return (
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
                onChange({ ...editor, slug: event.target.value.toLowerCase() })
              }
            />
          </label>
          <label>
            제목 (비우면 마크다운의 # 제목 사용)
            <input
              value={editor.title}
              placeholder={preview.title || "퀴즈 제목"}
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
            트랙 (퀴즈가 노출될 과제)
            <select
              value={editor.track}
              onChange={(event) => onChange({ ...editor, track: event.target.value })}
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
            md 파일 업로드 (내용을 아래 편집기로 불러옵니다)
            <input
              type="file"
              accept=".md,.markdown,text/markdown,text/plain"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) await loadFile(file);
                event.target.value = "";
              }}
            />
          </label>
          <label>
            퀴즈 마크다운
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
              disabled={busy || !editor.slug || preview.questions.length === 0}
              onClick={onSave}
            >
              저장
            </button>
            <button className="ghostButton" type="button" onClick={onClose}>
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
  );
}
