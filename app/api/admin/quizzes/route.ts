import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { quizStore } from "@/lib/quizStore";
import { parseQuiz } from "@/lib/quiz/parse";
import { findTrack } from "@/lib/tracks";

function parseQuizInput(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const { slug, title, badge, track, markdown, published } = body as Record<string, unknown>;
  if (typeof slug !== "string" || !/^[a-z0-9-]{2,64}$/.test(slug)) {
    return { error: "slug는 소문자·숫자·하이픈 2~64자여야 합니다." } as const;
  }
  if (typeof markdown !== "string" || markdown.trim().length === 0) {
    return { error: "퀴즈 마크다운을 입력해 주세요." } as const;
  }
  const parsed = parseQuiz(markdown);
  if (parsed.questions.length === 0) {
    return { error: "문항이 없습니다. `## 질문` 형식으로 문항을 추가해 주세요." } as const;
  }
  const resolvedTrack = typeof track === "string" ? track : "";
  if (resolvedTrack && !findTrack(resolvedTrack)) {
    return { error: "존재하지 않는 트랙입니다." } as const;
  }
  const resolvedTitle =
    (typeof title === "string" && title.trim()) || parsed.title || slug;
  return {
    input: {
      slug,
      title: resolvedTitle,
      badge: typeof badge === "string" && badge.trim() ? badge.trim() : "퀴즈 과제",
      track: resolvedTrack,
      markdown,
      published: published === true
    }
  } as const;
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  const [quizzes, counts] = await Promise.all([
    quizStore.list(),
    quizStore.countResponses()
  ]);
  return NextResponse.json({
    quizzes: quizzes.map((quiz) => ({
      ...quiz,
      questionCount: parseQuiz(quiz.markdown).questions.length,
      responseCount: counts[quiz.id] || 0
    }))
  });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  const parsed = parseQuizInput(await request.json().catch(() => null));
  if (!parsed) {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const exists = await quizStore.findBySlug(parsed.input.slug);
  if (exists) {
    return NextResponse.json({ error: "이미 사용 중인 slug입니다." }, { status: 409 });
  }
  const quiz = await quizStore.create(parsed.input);
  return NextResponse.json({ quiz });
}
