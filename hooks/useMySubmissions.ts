"use client";

import { useCallback, useEffect, useState } from "react";
import type { Submission } from "@/lib/types";

/**
 * 로그인한 사용자의 제출 내역을 불러온다.
 * track을 주면 해당 과제의 이번 주 제출(submission)도 함께 온다.
 */
export function useMySubmissions(enabled: boolean, track?: string) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [history, setHistory] = useState<Submission[]>([]);

  const reload = useCallback(async () => {
    const query = track ? `?track=${track}` : "";
    const res = await fetch(`/api/submissions${query}`);
    if (!res.ok) return;
    const data = await res.json();
    setHistory(data.history || []);
    setSubmission(data.submission || null);
  }, [track]);

  useEffect(() => {
    if (enabled) {
      reload();
    } else {
      setSubmission(null);
      setHistory([]);
    }
  }, [enabled, reload]);

  const applyUpserted = useCallback((upserted: Submission) => {
    setSubmission(upserted);
    setHistory((prev) => {
      const rest = prev.filter((item) => item.id !== upserted.id);
      return [upserted, ...rest];
    });
  }, []);

  return { submission, history, reload, applyUpserted };
}
