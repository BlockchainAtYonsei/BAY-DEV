"use client";

import type { Submission } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { formatWeekRange, getCurrentWeekKey } from "@/lib/week";

type Props = {
  title: string;
  submissions: Submission[];
};

export default function SubmissionHistory({ title, submissions }: Props) {
  if (submissions.length === 0) return null;
  const currentWeek = getCurrentWeekKey();

  return (
    <aside className="receipt">
      <span className="label">{title}</span>
      <ul className="historyList">
        {submissions.map((item) => (
          <li key={item.id}>
            <span className="historyWeek">
              {formatWeekRange(item.week)}
              {item.week === currentWeek && " (이번 주)"}
            </span>
            <a href={item.zombieUrl} target="_blank" rel="noreferrer">
              {item.zombieUrl}
            </a>
            {item.note && <small>{item.note}</small>}
            <small>{formatDateTime(item.updatedAt)}</small>
          </li>
        ))}
      </ul>
    </aside>
  );
}
