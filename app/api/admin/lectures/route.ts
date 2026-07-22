import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/guards";
import { lectureStore } from "@/lib/lectureStore";
import { parseLectureInput } from "@/lib/lecture/validation";

export async function GET() {
  const adminGuard = await requireAdmin();
  if (!adminGuard.ok) return adminGuard.res;
  const lectures = await lectureStore.list();
  return NextResponse.json({ lectures });
}

export async function POST(request: Request) {
  const adminGuard = await requireAdmin();
  if (!adminGuard.ok) return adminGuard.res;
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
