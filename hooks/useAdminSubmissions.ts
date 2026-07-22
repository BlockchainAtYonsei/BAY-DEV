"use client";

import { useAdminGate } from "@/hooks/useAdminGate";
import type { Submission } from "@/lib/types";

export function useAdminSubmissions() {
  const { data: submissions, authorized, reload, logout } = useAdminGate<Submission[]>(
    "/api/admin/submissions",
    (data) => (data as { submissions: Submission[] }).submissions,
    []
  );
  return { submissions, authorized, reload, logout };
}
