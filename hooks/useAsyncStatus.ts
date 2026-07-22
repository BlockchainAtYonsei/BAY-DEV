"use client";

import { useCallback, useState } from "react";

/** busy 플래그 + 결과/에러 메시지 상태의 반복 패턴을 모은 훅 */
export function useAsyncStatus() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const run = useCallback(async (task: () => Promise<string | void>) => {
    setBusy(true);
    setStatus("");
    try {
      const message = await task();
      if (message) setStatus(message);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "요청에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, status, setStatus, run };
}
