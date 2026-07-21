import { NextResponse } from "next/server";
import { getAdminPassword, setAdminSession } from "@/lib/session";

export async function POST(request: Request) {
  const { password } = (await request.json().catch(() => ({}))) as {
    password?: string;
  };

  if (!password || password !== getAdminPassword()) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  await setAdminSession();
  return NextResponse.json({ ok: true });
}
