import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/guards";
import { quizStore } from "@/lib/quizStore";
import { parseQuiz } from "@/lib/quiz/parse";
import { parseQuizInput } from "@/lib/quiz/validation";

type Params = { params: Promise<{ id: string }> };

/** 퀴즈 상세 + 파싱된 문항(정답 포함) + 전체 응답 */
export async function GET(_request: Request, { params }: Params) {
  const adminGuard = await requireAdmin();
  if (!adminGuard.ok) return adminGuard.res;
  const { id } = await params;
  const quiz = await quizStore.findById(id);
  if (!quiz) {
    return NextResponse.json({ error: "퀴즈를 찾을 수 없습니다." }, { status: 404 });
  }
  const parsed = parseQuiz(quiz.markdown);
  const responses = await quizStore.listResponses(quiz.id);
  return NextResponse.json({ quiz, parsed, responses });
}

export async function PUT(request: Request, { params }: Params) {
  const adminGuard = await requireAdmin();
  if (!adminGuard.ok) return adminGuard.res;
  const { id } = await params;
  const quiz = await quizStore.findById(id);
  if (!quiz) {
    return NextResponse.json({ error: "퀴즈를 찾을 수 없습니다." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  // 부분 수정도 전체 검증을 통과하도록 기존 값과 병합해 검증한다
  const merged = {
    slug: body.slug ?? quiz.slug,
    title: body.title ?? quiz.title,
    badge: body.badge ?? quiz.badge,
    track: body.track ?? quiz.track,
    markdown: body.markdown ?? quiz.markdown,
    published: body.published ?? quiz.published
  };
  const parsed = parseQuizInput(merged);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  if (parsed.input.slug !== quiz.slug && (await quizStore.findBySlug(parsed.input.slug))) {
    return NextResponse.json({ error: "이미 사용 중인 slug입니다." }, { status: 409 });
  }

  const updated = await quizStore.update(id, parsed.input);
  return NextResponse.json({ quiz: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const adminGuard = await requireAdmin();
  if (!adminGuard.ok) return adminGuard.res;
  const { id } = await params;
  const quiz = await quizStore.findById(id);
  if (!quiz) {
    return NextResponse.json({ error: "퀴즈를 찾을 수 없습니다." }, { status: 404 });
  }
  await quizStore.remove(id);
  return NextResponse.json({ ok: true });
}
