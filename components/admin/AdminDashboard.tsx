"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import AdminToolbar from "@/components/admin/AdminToolbar";
import AdminMetrics from "@/components/admin/AdminMetrics";
import TrackMatrices from "@/components/admin/TrackMatrices";
import SubmissionTable from "@/components/admin/SubmissionTable";
import { useAdminSubmissions } from "@/hooks/useAdminSubmissions";
import {
  collectWeeks,
  countByWeek,
  filterSubmissions,
  type SubmissionFilter
} from "@/lib/submissionFilters";
import { getCurrentWeekKey } from "@/lib/week";

export default function AdminDashboard() {
  const { submissions, authorized, reload, logout } = useAdminSubmissions();
  const [filter, setFilter] = useState<SubmissionFilter>({
    track: "all",
    week: "all",
    keyword: ""
  });

  const weeks = useMemo(() => collectWeeks(submissions), [submissions]);
  const filtered = useMemo(
    () => filterSubmissions(submissions, filter),
    [submissions, filter]
  );

  if (!authorized) {
    return (
      <main className="adminShell">
        <AdminLoginForm onSuccess={reload} />
      </main>
    );
  }

  return (
    <main className="adminShell">
      <section className="adminHeader">
        <h1>제출 현황</h1>
        <Link className="ghostButton" href="/admin/quizzes">
          퀴즈 관리
        </Link>
        <Link className="ghostButton" href="/admin/lectures">
          학습자료 관리
        </Link>
        <AdminToolbar
          filter={filter}
          weeks={weeks}
          onChange={setFilter}
          onRefresh={reload}
          onLogout={logout}
        />
      </section>

      <AdminMetrics
        total={submissions.length}
        currentWeekCount={countByWeek(submissions, getCurrentWeekKey())}
        visible={filtered.length}
      />

      <TrackMatrices submissions={submissions} trackFilter={filter.track} />

      <h2 className="sectionTitle">제출 목록</h2>
      <SubmissionTable submissions={filtered} />
    </main>
  );
}
