import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { quizStore } from "@/lib/quizStore";
import { parseQuiz } from "@/lib/quiz/parse";
import { findTrack } from "@/lib/tracks";

type Params = { params: Promise<{ id: string }> };

/** 퀴즈 상세 + 파싱된 문항(정답 포함) + 전체 응답 */
export async function GET(_request: Request, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
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
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;
  const quiz = await quizStore.findById(id);
  if (!quiz) {
    return NextResponse.json({ error: "퀴즈를 찾을 수 없습니다." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const input: Parameters<typeof quizStore.update>[1] = {};

  if (typeof body.slug === "string" && body.slug !== quiz.slug) {
    if (!/^[a-z0-9-]{2,64}$/.test(body.slug)) {
      return NextResponse.json({ error: "slug는 소문자·숫자·하이픈 2~64자여야 합니다." }, { status: 400 });
    }
    if (await quizStore.findBySlug(body.slug)) {
      return NextResponse.json({ error: "이미 사용 중인 slug입니다." }, { status: 409 });
    }
    input.slug = body.slug;
  }
  if (typeof body.title === "string" && body.title.trim()) input.title = body.title.trim();
  if (typeof body.badge === "string" && body.badge.trim()) input.badge = body.badge.trim();
  if (typeof body.track === "string") {
    if (body.track && !findTrack(body.track)) {
      return NextResponse.json({ error: "존재하지 않는 트랙입니다." }, { status: 400 });
    }
    input.track = body.track;
  }
  if (typeof body.markdown === "string") {
    if (parseQuiz(body.markdown).questions.length === 0) {
      return NextResponse.json(
        { error: "문항이 없습니다. `## 질문` 형식으로 문항을 추가해 주세요." },
        { status: 400 }
      );
    }
    input.markdown = body.markdown;
  }
  if (typeof body.published === "boolean") input.published = body.published;

  const updated = await quizStore.update(id, input);
  return NextResponse.json({ quiz: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;
  const quiz = await quizStore.findById(id);
  if (!quiz) {
    return NextResponse.json({ error: "퀴즈를 찾을 수 없습니다." }, { status: 404 });
  }
  await quizStore.remove(id);
  return NextResponse.json({ ok: true });
}
