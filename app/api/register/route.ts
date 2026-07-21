import { NextResponse } from "next/server";
import { getWalletSession } from "@/lib/session";
import { parseName } from "@/lib/validation";
import { userStore } from "@/lib/userStore";

export async function POST(request: Request) {
  const session = await getWalletSession();
  if (!session) {
    return NextResponse.json({ error: "지갑 로그인이 필요합니다." }, { status: 401 });
  }

  const existing = await userStore.findByWallet(session.wallet);
  if (existing) {
    return NextResponse.json({ user: existing });
  }

  const parsed = parseName(await request.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const user = await userStore.create(session.wallet, parsed.name);
  return NextResponse.json({ user });
}
