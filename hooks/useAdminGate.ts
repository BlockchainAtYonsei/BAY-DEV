"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * 관리자 화면 공통 패턴: 목록 API를 불러 인증 여부를 판정하고,
 * 401이면 로그인 폼으로 전환할 수 있게 authorized=false를 유지한다.
 */
export function useAdminGate<T>(url: string, extract: (data: unknown) => T, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [authorized, setAuthorized] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetch(url);
    if (!res.ok) {
      setAuthorized(false);
      return;
    }
    setData(extract(await res.json()));
    setAuthorized(true);
    // extract는 렌더마다 새 함수여도 무방하도록 의존성에서 제외한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => {
    reload();
  }, [reload]);

  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthorized(false);
  }, []);

  return { data, authorized, reload, logout };
}
