"use client";

import Link from "next/link";
import type { Quiz } from "@/lib/quizStore";
import { findTrack } from "@/lib/tracks";

export type QuizListItem = Quiz & { questionCount: number; responseCount: number };

type Props = {
  quizzes: QuizListItem[];
  busy: boolean;
  onEdit: (quiz: QuizListItem) => void;
  onResponses: (quiz: QuizListItem) => void;
  onDiscussion: (quiz: QuizListItem) => void;
  onTogglePublished: (quiz: QuizListItem) => void;
  onRemove: (quiz: QuizListItem) => void;
};

/** 퀴즈 목록 테이블 — 표시와 액션 버튼만 담당한다 */
export default function QuizTable({
  quizzes,
  busy,
  onEdit,
  onResponses,
  onDiscussion,
  onTogglePublished,
  onRemove
}: Props) {
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>제목</th>
            <th>slug</th>
            <th>트랙</th>
            <th>문항</th>
            <th>응답</th>
            <th>상태</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {quizzes.length === 0 && (
            <tr>
              <td colSpan={7}>아직 퀴즈가 없습니다. 새 퀴즈를 만들어 보세요.</td>
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
              <td>{findTrack(quiz.track)?.title || "홈 단독"}</td>
              <td>{quiz.questionCount}</td>
              <td>{quiz.responseCount}</td>
              <td>{quiz.published ? "게시됨" : "비공개"}</td>
              <td className="quizRowActions">
                <button className="ghostButton" type="button" onClick={() => onEdit(quiz)}>
                  편집
                </button>
                <button className="ghostButton" type="button" onClick={() => onResponses(quiz)}>
                  응답 보기
                </button>
                <button className="ghostButton" type="button" onClick={() => onDiscussion(quiz)}>
                  토론 보기
                </button>
                <button
                  className="ghostButton"
                  type="button"
                  disabled={busy}
                  onClick={() => onTogglePublished(quiz)}
                >
                  {quiz.published ? "숨기기" : "게시"}
                </button>
                <button
                  className="ghostButton"
                  type="button"
                  disabled={busy}
                  onClick={() => onRemove(quiz)}
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
