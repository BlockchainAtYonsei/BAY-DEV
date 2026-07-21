import { NextResponse } from "next/server";
import { getWalletSession } from "@/lib/session";
import { userStore } from "@/lib/userStore";

export async function GET() {
  const session = await getWalletSession();
  if (!session) {
    return NextResponse.json({ session: null });
  }

  const user = await userStore.findByWallet(session.wallet);
  return NextResponse.json({
    session: { wallet: session.wallet, name: user?.name || null }
  });
}
