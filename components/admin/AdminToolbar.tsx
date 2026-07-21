"use client";

import { TRACKS } from "@/lib/tracks";
import { formatWeekRange, getCurrentWeekKey } from "@/lib/week";
import type { SubmissionFilter } from "@/lib/submissionFilters";

type Props = {
  filter: SubmissionFilter;
  weeks: string[];
  onChange: (filter: SubmissionFilter) => void;
  onRefresh: () => void;
  onLogout: () => void;
};

export default function AdminToolbar({ filter, weeks, onChange, onRefresh, onLogout }: Props) {
  const currentWeek = getCurrentWeekKey();

  return (
    <div className="adminActions">
      <select
        aria-label="과제 선택"
        value={filter.track}
        onChange={(event) => onChange({ ...filter, track: event.target.value })}
      >
        <option value="all">전체 과제</option>
        {TRACKS.map((track) => (
          <option key={track.slug} value={track.slug}>
            {track.title}
          </option>
        ))}
      </select>
      <select
        aria-label="주차 선택"
        value={filter.week}
        onChange={(event) => onChange({ ...filter, week: event.target.value })}
      >
        <option value="all">전체 주차</option>
        {weeks.map((weekKey) => (
          <option key={weekKey} value={weekKey}>
            {formatWeekRange(weekKey)}
            {weekKey === currentWeek ? " (이번 주)" : ""}
          </option>
        ))}
      </select>
      <input
        aria-label="검색"
        placeholder="이름, 지갑, URL 검색"
        value={filter.keyword}
        onChange={(event) => onChange({ ...filter, keyword: event.target.value })}
      />
      <button className="ghostButton" onClick={onRefresh} type="button">
        새로고침
      </button>
      <button className="ghostButton" onClick={onLogout} type="button">
        로그아웃
      </button>
    </div>
  );
}
