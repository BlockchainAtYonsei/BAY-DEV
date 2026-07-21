"use client";

import type { Submission } from "@/lib/types";
import { findTrack } from "@/lib/tracks";
import { formatDateTime, shortWallet } from "@/lib/format";
import { formatWeekRange } from "@/lib/week";

type Props = {
  submissions: Submission[];
};

export default function SubmissionTable({ submissions }: Props) {
  return (
    <section className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>과제</th>
            <th>주차</th>
            <th>이름</th>
            <th>지갑</th>
            <th>제출 URL</th>
            <th>메모</th>
            <th>제출일</th>
            <th>수정일</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr key={submission.id}>
              <td>{findTrack(submission.track)?.title || submission.track}</td>
              <td>{formatWeekRange(submission.week)}</td>
              <td>{submission.name}</td>
              <td title={submission.wallet}>{shortWallet(submission.wallet)}</td>
              <td className="urlCell">
                <a href={submission.zombieUrl} target="_blank" rel="noreferrer">
                  {submission.zombieUrl}
                </a>
              </td>
              <td>{submission.note || "-"}</td>
              <td>{formatDateTime(submission.createdAt)}</td>
              <td>{formatDateTime(submission.updatedAt)}</td>
            </tr>
          ))}
          {submissions.length === 0 && (
            <tr>
              <td colSpan={8} className="empty">
                제출 내역이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
