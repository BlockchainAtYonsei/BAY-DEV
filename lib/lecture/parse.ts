/**
 * 강의록 마크다운 포맷 파서.
 *
 * ```md
 * # 강의 제목
 * 인트로 문단 (첫 ## 이전)
 *
 * ## 섹션 제목
 * :라벨 개념 ①          ← 섹션 상단 작은 라벨 (선택)
 *
 * 일반 마크다운 문단
 *
 * :::cards              ← 블록 컨테이너 (cards | flow | steps | compare | callout)
 * ### 카드 제목
 * 카드 내용 (마크다운)
 * ### 카드 제목 2
 * 내용
 * :::
 * ```
 *
 * - cards   : 카드 그리드 (개념 상자들)
 * - flow    : 가로 화살표 흐름 (합의 절차 등)
 * - steps   : 번호 매긴 단계 (트랜잭션 생애주기 등)
 * - compare : 좌우 2단 비교 (일반 노드 vs 검증자)
 * - callout : 강조 박스 (### 없이 내용만)
 * - 컨테이너 밖 내용은 일반 마크다운 (코드펜스 포함)
 */

export type LectureItem = {
  title: string;
  body: string;
};

export type LectureBlock =
  | { kind: "markdown"; text: string }
  | { kind: "cards" | "flow" | "steps" | "compare"; items: LectureItem[] }
  | { kind: "callout"; text: string };

export type LectureSection = {
  label: string;
  title: string;
  blocks: LectureBlock[];
};

export type ParsedLecture = {
  title: string;
  intro: string;
  sections: LectureSection[];
};

const CONTAINER_RE = /^:::(cards|flow|steps|compare|callout)\s*$/;
const LABEL_RE = /^:라벨\s+(.+)$/;

function parseItems(lines: string[]): LectureItem[] {
  const items: LectureItem[] = [];
  let current: { title: string; body: string[] } | null = null;
  for (const line of lines) {
    if (/^###\s+/.test(line)) {
      if (current) items.push({ title: current.title, body: current.body.join("\n").trim() });
      current = { title: line.replace(/^###\s+/, "").trim(), body: [] };
    } else if (current) {
      current.body.push(line);
    } else if (line.trim()) {
      // ### 없이 시작한 내용은 제목 없는 아이템으로
      current = { title: "", body: [line] };
    }
  }
  if (current) items.push({ title: current.title, body: current.body.join("\n").trim() });
  return items;
}

export function parseLecture(markdown: string): ParsedLecture {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");

  let title = "";
  const introLines: string[] = [];
  const sections: LectureSection[] = [];
  let current: LectureSection | null = null;
  let markdownBuffer: string[] = [];
  let container: { kind: string; lines: string[] } | null = null;
  let inFence = false;

  const flushMarkdown = () => {
    const text = markdownBuffer.join("\n").trim();
    if (text && current) current.blocks.push({ kind: "markdown", text });
    markdownBuffer = [];
  };

  for (const line of lines) {
    if (/^```/.test(line.trim())) inFence = !inFence;

    // 컨테이너 내부
    if (container) {
      if (!inFence && line.trim() === ":::") {
        if (container.kind === "callout") {
          current?.blocks.push({ kind: "callout", text: container.lines.join("\n").trim() });
        } else {
          current?.blocks.push({
            kind: container.kind as "cards" | "flow" | "steps" | "compare",
            items: parseItems(container.lines)
          });
        }
        container = null;
      } else {
        container.lines.push(line);
      }
      continue;
    }

    const containerMatch = inFence ? null : line.match(CONTAINER_RE);
    if (containerMatch && current) {
      flushMarkdown();
      container = { kind: containerMatch[1], lines: [] };
      continue;
    }

    if (!inFence && /^##\s+/.test(line) && !/^###/.test(line)) {
      flushMarkdown();
      current = { label: "", title: line.replace(/^##\s+/, "").trim(), blocks: [] };
      sections.push(current);
      continue;
    }

    if (!current) {
      if (!inFence && /^#\s+/.test(line) && !title) {
        title = line.replace(/^#\s+/, "").trim();
      } else {
        introLines.push(line);
      }
      continue;
    }

    const labelMatch = inFence ? null : line.match(LABEL_RE);
    if (labelMatch && current.blocks.length === 0 && !markdownBuffer.some((l) => l.trim())) {
      current.label = labelMatch[1].trim();
      continue;
    }

    markdownBuffer.push(line);
  }

  // 닫히지 않은 컨테이너는 markdown으로 살린다
  if (container) markdownBuffer.push(...container.lines);
  flushMarkdown();

  return { title, intro: introLines.join("\n").trim(), sections };
}
