import type { Submission } from "./types";

export type SubmissionFilter = {
  track: string; // "all" 또는 track slug
  week: string; // "all" 또는 week key
  keyword: string;
};

export function filterSubmissions(submissions: Submission[], filter: SubmissionFilter) {
  const keyword = filter.keyword.trim().toLowerCase();
  return submissions.filter((submission) => {
    if (filter.track !== "all" && submission.track !== filter.track) return false;
    if (filter.week !== "all" && submission.week !== filter.week) return false;
    if (!keyword) return true;
    return [submission.name, submission.wallet, submission.zombieUrl, submission.note]
      .join(" ")
      .toLowerCase()
      .includes(keyword);
  });
}

/** 데이터에 존재하는 주차 목록 (최신순) */
export function collectWeeks(submissions: Submission[]) {
  return [...new Set(submissions.map((submission) => submission.week))].sort().reverse();
}

export function countByWeek(submissions: Submission[], week: string) {
  return submissions.filter((submission) => submission.week === week).length;
}
