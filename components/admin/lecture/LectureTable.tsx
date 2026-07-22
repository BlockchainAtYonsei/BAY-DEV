"use client";

import Link from "next/link";
import type { Lecture } from "@/lib/lectureStore";
import { findTrack } from "@/lib/tracks";

type Props = {
  lectures: Lecture[];
  busy: boolean;
  onEdit: (lecture: Lecture) => void;
  onTogglePublished: (lecture: Lecture) => void;
  onRemove: (lecture: Lecture) => void;
};

/** 학습자료 목록 테이블 — 표시와 액션 버튼만 담당한다 */
export default function LectureTable({
  lectures,
  busy,
  onEdit,
  onTogglePublished,
  onRemove
}: Props) {
  return (
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
              <td colSpan={6}>아직 학습자료가 없습니다. 새 학습자료를 만들어 보세요.</td>
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
                {findTrack(lecture.track)?.title || "임베드 전용"}
                {lecture.format === "html" ? " · 인터랙티브" : ""}
              </td>
              <td>{lecture.published ? "게시됨" : "비공개"}</td>
              <td className="quizRowActions">
                <button className="ghostButton" type="button" onClick={() => onEdit(lecture)}>
                  편집
                </button>
                <button
                  className="ghostButton"
                  type="button"
                  disabled={busy}
                  onClick={() => onTogglePublished(lecture)}
                >
                  {lecture.published ? "숨기기" : "게시"}
                </button>
                <button
                  className="ghostButton"
                  type="button"
                  disabled={busy}
                  onClick={() => onRemove(lecture)}
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
