import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { lectureStore } from "@/lib/lectureStore";
import { parseLectureInput } from "@/lib/lecture/validation";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  const lectures = await lectureStore.list();
  return NextResponse.json({ lectures });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  const parsed = parseLectureInput(await request.json().catch(() => null));
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  if (await lectureStore.findBySlug(parsed.input.slug)) {
    return NextResponse.json({ error: "이미 사용 중인 slug입니다." }, { status: 409 });
  }
  const lecture = await lectureStore.create(parsed.input);
  return NextResponse.json({ lecture });
}
