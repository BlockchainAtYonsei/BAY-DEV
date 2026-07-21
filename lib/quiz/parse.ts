/**
 * 마크다운 퀴즈 포맷 파서.
 *
 * ```md
 * # 퀴즈 제목            ← 선택 (없으면 DB title 사용)
 * 인트로 설명...          ← 첫 `##` 이전 내용
 *
 * ## 질문 1 제목
 * 질문 부가 설명 (마크다운, 코드블록 가능)
 * - [ ] 보기 A
 * - [x] 보기 B           ← [x] 가 정답
 *
 * ## 질문 2 (보기가 없으면 주관식)
 * ```
 *
 * - [x] 1개 → 단일 선택(single), 2개 이상 → 복수 선택(multiple)
 * - 보기가 없으면 주관식(text), 자동 채점에서 제외
 */

export type QuizQuestionType = "single" | "multiple" | "text";

export type QuizQuestion = {
  index: number;
  prompt: string;
  body: string;
  type: QuizQuestionType;
  options: string[];
  /** 정답 보기 인덱스 목록 (주관식이면 빈 배열) */
  correct: number[];
};

export type ParsedQuiz = {
  title: string;
  intro: string;
  questions: QuizQuestion[];
};

/** 학생에게 내려주는 형태 — 정답 정보 제거 */
export type PublicQuizQuestion = Omit<QuizQuestion, "correct">;

/** 문항별 응답: single → 보기 인덱스, multiple → 인덱스 배열, text → 문자열 */
export type QuizAnswer = number | number[] | string | null;

const OPTION_RE = /^[-*]\s*\[([ xX])\]\s+(.*)$/;

export function parseQuiz(markdown: string): ParsedQuiz {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");

  let title = "";
  const introLines: string[] = [];
  const questions: QuizQuestion[] = [];
  let current: { prompt: string; bodyLines: string[]; options: string[]; correct: number[] } | null = null;
  let inFence = false;

  const flush = () => {
    if (!current) return;
    const { prompt, bodyLines, options, correct } = current;
    questions.push({
      index: questions.length,
      prompt,
      body: bodyLines.join("\n").trim(),
      type: options.length === 0 ? "text" : correct.length > 1 ? "multiple" : "single",
      options,
      correct
    });
    current = null;
  };

  for (const line of lines) {
    if (/^```/.test(line.trim())) inFence = !inFence;

    if (!inFence && /^##\s+/.test(line)) {
      flush();
      current = { prompt: line.replace(/^##\s+/, "").trim(), bodyLines: [], options: [], correct: [] };
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

    const option = inFence ? null : line.match(OPTION_RE);
    if (option) {
      if (option[1].toLowerCase() === "x") current.correct.push(current.options.length);
      current.options.push(option[2].trim());
    } else {
      current.bodyLines.push(line);
    }
  }
  flush();

  return { title, intro: introLines.join("\n").trim(), questions };
}

export function toPublicQuestions(questions: QuizQuestion[]): PublicQuizQuestion[] {
  return questions.map(({ correct: _correct, ...rest }) => rest);
}

/** 자동 채점: 주관식은 제외. total = 채점 가능한 문항 수 */
export function gradeAnswers(questions: QuizQuestion[], answers: QuizAnswer[]) {
  let score = 0;
  let total = 0;
  for (const question of questions) {
    if (question.type === "text" || question.correct.length === 0) continue;
    total += 1;
    const answer = answers[question.index];
    if (question.type === "single") {
      if (typeof answer === "number" && question.correct[0] === answer) score += 1;
    } else {
      const picked = Array.isArray(answer) ? [...answer].sort() : null;
      const expected = [...question.correct].sort();
      if (picked && picked.length === expected.length && picked.every((v, i) => v === expected[i])) {
        score += 1;
      }
    }
  }
  return { score, total };
}

/** 클라이언트가 보낸 응답 배열을 문항 구조에 맞게 정리 (이상값은 null 처리) */
export function sanitizeAnswers(questions: QuizQuestion[], raw: unknown): QuizAnswer[] | null {
  if (!Array.isArray(raw) || raw.length > questions.length) return null;
  return questions.map((question) => {
    const value = (raw as unknown[])[question.index];
    if (value === null || value === undefined) return null;
    if (question.type === "text") {
      return typeof value === "string" ? value.slice(0, 4000) : null;
    }
    if (question.type === "single") {
      return typeof value === "number" && Number.isInteger(value) && value >= 0 && value < question.options.length
        ? value
        : null;
    }
    if (!Array.isArray(value)) return null;
    const picked = value.filter(
      (v): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0 && v < question.options.length
    );
    return [...new Set(picked)].sort((a, b) => a - b);
  });
}
