import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { submissionStore } from "@/lib/submissionStore";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }

  const submissions = await submissionStore.list();
  return NextResponse.json({ submissions });
}
