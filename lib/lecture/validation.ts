import { findTrack } from "@/lib/tracks";
import { parseLecture } from "./parse";
import type { LectureInput } from "@/lib/lectureStore";

const SLUG_RE = /^[a-z0-9-]{2,64}$/;

type Result = { input: LectureInput } | { error: string };

/** 학습자료 생성/수정 입력 검증. 공통 규칙을 한곳에 모은다. */
export function parseLectureInput(body: unknown): Result {
  if (!body || typeof body !== "object") {
    return { error: "요청 형식이 올바르지 않습니다." };
  }
  const { slug, title, badge, track, order, format, markdown, published } = body as Record<
    string,
    unknown
  >;

  if (typeof slug !== "string" || !SLUG_RE.test(slug)) {
    return { error: "slug는 소문자·숫자·하이픈 2~64자여야 합니다." };
  }
  const resolvedFormat = format === "html" ? "html" : "markdown";
  if (typeof markdown !== "string" || markdown.trim().length === 0) {
    return { error: "학습자료 내용을 입력해 주세요." };
  }
  const resolvedTrack = typeof track === "string" ? track : "";
  if (resolvedTrack && !findTrack(resolvedTrack)) {
    return { error: "존재하지 않는 트랙입니다." };
  }

  // 마크다운 형식은 섹션 구조를, HTML 형식은 문서 제목만 확인한다
  let fallbackTitle = "";
  if (resolvedFormat === "markdown") {
    const parsed = parseLecture(markdown);
    if (parsed.sections.length === 0) {
      return { error: "섹션이 없습니다. `## 섹션 제목` 형식으로 내용을 추가해 주세요." };
    }
    fallbackTitle = parsed.title;
  } else {
    fallbackTitle = markdown.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() || "";
  }

  return {
    input: {
      slug,
      title: (typeof title === "string" && title.trim()) || fallbackTitle || slug,
      badge: typeof badge === "string" && badge.trim() ? badge.trim() : "학습자료",
      track: resolvedTrack,
      order:
        typeof order === "number" && Number.isInteger(order) && order >= 0 ? order : 0,
      format: resolvedFormat,
      markdown,
      published: published === true
    }
  };
}
