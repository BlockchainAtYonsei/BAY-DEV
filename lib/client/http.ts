/** JSON API 호출 공통 래퍼 — 실패 시 서버의 error 메시지로 throw한다. */
export async function fetchJson<T = unknown>(
  url: string,
  options?: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
  }
): Promise<T> {
  const res = await fetch(url, {
    method: options?.method || "GET",
    ...(options?.body !== undefined
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(options.body)
        }
      : {})
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (data as { error?: string } | null)?.error || "요청에 실패했습니다."
    );
  }
  return data as T;
}
