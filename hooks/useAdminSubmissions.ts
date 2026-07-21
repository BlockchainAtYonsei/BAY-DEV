"use client";

import { useCallback, useEffect, useState } from "react";
import type { Submission } from "@/lib/types";

export function useAdminSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [authorized, setAuthorized] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetch("/api/admin/submissions");
    if (!res.ok) {
      setAuthorized(false);
      return;
    }
    const data = await res.json();
    setSubmissions(data.submissions);
    setAuthorized(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthorized(false);
  }, []);

  return { submissions, authorized, reload, logout };
}
