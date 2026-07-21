"use client";

import WeeklyMatrix from "@/components/admin/WeeklyMatrix";
import type { Submission } from "@/lib/types";
import { TRACKS } from "@/lib/tracks";

type Props = {
  submissions: Submission[];
  /** "all"이면 데이터가 있는 모든 과제의 매트릭스를 보여준다 */
  trackFilter: string;
};

export default function TrackMatrices({ submissions, trackFilter }: Props) {
  const slugsWithData = new Set(submissions.map((submission) => submission.track));

  return (
    <>
      {TRACKS.filter(
        (track) =>
          slugsWithData.has(track.slug) &&
          (trackFilter === "all" || track.slug === trackFilter)
      ).map((track) => (
        <section key={track.slug}>
          <h2 className="sectionTitle">{track.title} — 주차별 현황</h2>
          <WeeklyMatrix
            submissions={submissions.filter(
              (submission) => submission.track === track.slug
            )}
          />
        </section>
      ))}
    </>
  );
}
