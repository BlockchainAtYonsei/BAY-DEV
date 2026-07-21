import { NextResponse } from "next/server";
import { buildWalletMessage, createNonce, setLoginNonce } from "@/lib/session";

export async function POST(request: Request) {
  const { wallet } = (await request.json()) as { wallet?: string };

  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return NextResponse.json({ error: "올바른 지갑 주소가 아닙니다." }, { status: 400 });
  }

  const nonce = createNonce();
  await setLoginNonce(wallet, nonce);

  return NextResponse.json({
    nonce,
    message: buildWalletMessage(wallet, nonce)
  });
}
