import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { lectureStore } from "@/lib/lectureStore";
import { parseLectureInput } from "@/lib/lecture/validation";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;
  const lecture = await lectureStore.findById(id);
  if (!lecture) {
    return NextResponse.json({ error: "강의록을 찾을 수 없습니다." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  // 부분 수정도 전체 검증을 통과하도록 기존 값과 병합해 검증한다
  const merged = {
    slug: body.slug ?? lecture.slug,
    title: body.title ?? lecture.title,
    badge: body.badge ?? lecture.badge,
    track: body.track ?? lecture.track,
    order: body.order ?? lecture.order,
    format: body.format ?? lecture.format,
    markdown: body.markdown ?? lecture.markdown,
    published: body.published ?? lecture.published
  };
  const parsed = parseLectureInput(merged);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  if (parsed.input.slug !== lecture.slug && (await lectureStore.findBySlug(parsed.input.slug))) {
    return NextResponse.json({ error: "이미 사용 중인 slug입니다." }, { status: 409 });
  }

  const updated = await lectureStore.update(id, parsed.input);
  return NextResponse.json({ lecture: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;
  const lecture = await lectureStore.findById(id);
  if (!lecture) {
    return NextResponse.json({ error: "강의록을 찾을 수 없습니다." }, { status: 404 });
  }
  await lectureStore.remove(id);
  return NextResponse.json({ ok: true });
}
