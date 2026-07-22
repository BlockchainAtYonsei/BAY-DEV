import { NextResponse } from "next/server";
import { getWalletSession, isAdmin } from "@/lib/session";
import { userStore } from "@/lib/userStore";
import { quizStore, type Quiz } from "@/lib/quizStore";

/** 실패 시 바로 반환할 수 있는 NextResponse를 담는 가드 결과 */
type Guard<T> = { ok: true; value: T } | { ok: false; res: NextResponse };

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** 지갑 세션 필수 */
export async function requireWallet(): Promise<Guard<{ wallet: string }>> {
  const session = await getWalletSession();
  if (!session) return { ok: false, res: jsonError("지갑 로그인이 필요합니다.", 401) };
  return { ok: true, value: session };
}

/** 지갑 세션 + 이름 등록 필수 */
export async function requireRegisteredUser(): Promise<
  Guard<{ wallet: string; name: string }>
> {
  const session = await requireWallet();
  if (!session.ok) return session;
  const user = await userStore.findByWallet(session.value.wallet);
  if (!user) return { ok: false, res: jsonError("이름 등록이 필요합니다.", 403) };
  return { ok: true, value: { wallet: session.value.wallet, name: user.name } };
}

/** 관리자 세션 필수 */
export async function requireAdmin(): Promise<Guard<true>> {
  if (!(await isAdmin())) {
    return { ok: false, res: jsonError("관리자 로그인이 필요합니다.", 401) };
  }
  return { ok: true, value: true };
}

/** slug로 게시된 퀴즈 조회 (비공개·미존재는 404) */
export async function requirePublishedQuiz(slug: string): Promise<Guard<Quiz>> {
  const quiz = await quizStore.findBySlug(slug);
  if (!quiz || !quiz.published) {
    return { ok: false, res: jsonError("퀴즈를 찾을 수 없습니다.", 404) };
  }
  return { ok: true, value: quiz };
}
