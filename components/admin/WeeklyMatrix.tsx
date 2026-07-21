"use client";

import { useMemo } from "react";
import type { Submission } from "@/lib/types";
import { formatWeekRange } from "@/lib/week";

type Props = {
  submissions: Submission[];
};

type Person = {
  wallet: string;
  name: string;
  latestAt: string;
  byWeek: Map<string, Submission>;
};

export default function WeeklyMatrix({ submissions }: Props) {
  const { people, weeks } = useMemo(() => {
    const weekSet = new Set<string>();
    const byWallet = new Map<string, Person>();

    for (const submission of submissions) {
      weekSet.add(submission.week);
      let person = byWallet.get(submission.wallet);
      if (!person) {
        person = {
          wallet: submission.wallet,
          name: submission.name,
          latestAt: submission.updatedAt,
          byWeek: new Map()
        };
        byWallet.set(submission.wallet, person);
      }
      person.byWeek.set(submission.week, submission);
      // 이름을 바꿔 제출했으면 가장 최근 이름을 쓴다
      if (submission.updatedAt >= person.latestAt) {
        person.latestAt = submission.updatedAt;
        person.name = submission.name;
      }
    }

    return {
      people: [...byWallet.values()].sort((a, b) => a.name.localeCompare(b.name, "ko")),
      weeks: [...weekSet].sort()
    };
  }, [submissions]);

  if (people.length === 0) {
    return null;
  }

  return (
    <section className="tableWrap matrixWrap">
      <table>
        <thead>
          <tr>
            <th>이름</th>
            {weeks.map((week) => (
              <th key={week} className="matrixCell">
                {formatWeekRange(week)}
              </th>
            ))}
            <th className="matrixCell">제출 수</th>
          </tr>
        </thead>
        <tbody>
          {people.map((person) => (
            <tr key={person.wallet}>
              <td title={person.wallet}>{person.name}</td>
              {weeks.map((week) => {
                const submission = person.byWeek.get(week);
                return (
                  <td key={week} className="matrixCell">
                    {submission ? (
                      <a
                        className="cellOk"
                        href={submission.zombieUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={new Date(submission.updatedAt).toLocaleString("ko-KR")}
                      >
                        ✓
                      </a>
                    ) : (
                      <span className="cellMiss">－</span>
                    )}
                  </td>
                );
              })}
              <td className="matrixCell">
                {person.byWeek.size} / {weeks.length}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
