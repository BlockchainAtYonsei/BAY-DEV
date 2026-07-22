"use client";

import { useCallback, useEffect, useState } from "react";

/** 문항별 토론 댓글 수 뱃지 상태 */
export function useQuestionComments(slug: string, loggedIn: boolean) {
  const [counts, setCounts] = useState<Record<number, number>>({});

  const refresh = useCallback(async () => {
    const data = await fetch(`/api/quizzes/${slug}/comments`)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
    if (data?.counts) setCounts(data.counts);
  }, [slug]);

  useEffect(() => {
    if (loggedIn) refresh();
  }, [loggedIn, refresh]);

  const setCount = useCallback((questionIndex: number, count: number) => {
    setCounts((prev) => ({ ...prev, [questionIndex]: count }));
  }, []);

  return { counts, refresh, setCount };
}
