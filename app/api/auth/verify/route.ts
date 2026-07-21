import { NextResponse } from "next/server";
import {
  clearLoginNonce,
  getLoginNonce,
  setWalletSession,
  verifyWalletSignature
} from "@/lib/session";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    wallet?: string;
    nonce?: string;
    signature?: string;
  };

  if (!body.wallet || !body.nonce || !body.signature) {
    return NextResponse.json({ error: "서명 정보가 부족합니다." }, { status: 400 });
  }

  if (!(await getLoginNonce(body.wallet, body.nonce))) {
    return NextResponse.json({ error: "로그인 요청이 만료되었습니다." }, { status: 401 });
  }

  const ok = await verifyWalletSignature({
    wallet: body.wallet,
    nonce: body.nonce,
    signature: body.signature
  });

  if (!ok) {
    return NextResponse.json({ error: "지갑 서명 검증에 실패했습니다." }, { status: 401 });
  }

  await setWalletSession(body.wallet);
  await clearLoginNonce();
  return NextResponse.json({ wallet: body.wallet.toLowerCase() });
}
