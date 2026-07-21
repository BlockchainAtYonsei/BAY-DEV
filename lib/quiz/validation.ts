import { findTrack } from "@/lib/tracks";
import { parseQuiz } from "./parse";

const SLUG_RE = /^[a-z0-9-]{2,64}$/;

export type QuizInput = {
  slug: string;
  title: string;
  badge: string;
  track: string;
  markdown: string;
  published: boolean;
};

type Result = { input: QuizInput } | { error: string };

/** 퀴즈 생성/수정 입력 검증. 생성·수정 라우트가 공유하는 단일 규칙. */
export function parseQuizInput(body: unknown): Result {
  if (!body || typeof body !== "object") {
    return { error: "요청 형식이 올바르지 않습니다." };
  }
  const { slug, title, badge, track, markdown, published } = body as Record<string, unknown>;

  if (typeof slug !== "string" || !SLUG_RE.test(slug)) {
    return { error: "slug는 소문자·숫자·하이픈 2~64자여야 합니다." };
  }
  if (typeof markdown !== "string" || markdown.trim().length === 0) {
    return { error: "퀴즈 마크다운을 입력해 주세요." };
  }
  const resolvedTrack = typeof track === "string" ? track : "";
  if (resolvedTrack && !findTrack(resolvedTrack)) {
    return { error: "존재하지 않는 트랙입니다." };
  }
  const parsed = parseQuiz(markdown);
  if (parsed.questions.length === 0) {
    return { error: "문항이 없습니다. `## 질문` 형식으로 문항을 추가해 주세요." };
  }

  return {
    input: {
      slug,
      title: (typeof title === "string" && title.trim()) || parsed.title || slug,
      badge: typeof badge === "string" && badge.trim() ? badge.trim() : "퀴즈 과제",
      track: resolvedTrack,
      markdown,
      published: published === true
    }
  };
}
