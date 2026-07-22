import { NextResponse } from "next/server";
import { getWalletSession } from "@/lib/session";
import { getPushPublicKey, pushStore } from "@/lib/push";

/** 클라이언트 구독에 필요한 VAPID 공개키 (빌드타임 인라인 대신 런타임 제공) */
export async function GET() {
  const key = getPushPublicKey();
  if (!key) {
    return NextResponse.json({ error: "푸시가 설정되지 않았습니다." }, { status: 503 });
  }
  return NextResponse.json({ publicKey: key });
}

export async function POST(request: Request) {
  const session = await getWalletSession();
  if (!session) {
    return NextResponse.json({ error: "지갑 로그인이 필요합니다." }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  } | null;
  if (
    !body?.endpoint ||
    typeof body.endpoint !== "string" ||
    typeof body.keys?.p256dh !== "string" ||
    typeof body.keys?.auth !== "string"
  ) {
    return NextResponse.json({ error: "구독 정보가 올바르지 않습니다." }, { status: 400 });
  }
  await pushStore.subscribe(session.wallet, {
    endpoint: body.endpoint,
    p256dh: body.keys.p256dh,
    auth: body.keys.auth
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await getWalletSession();
  if (!session) {
    return NextResponse.json({ error: "지갑 로그인이 필요합니다." }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { endpoint?: string } | null;
  if (!body?.endpoint) {
    return NextResponse.json({ error: "endpoint가 필요합니다." }, { status: 400 });
  }
  await pushStore.unsubscribe(body.endpoint);
  return NextResponse.json({ ok: true });
}
