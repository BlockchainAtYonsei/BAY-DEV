import { describe, expect, it } from "vitest";
import {
  gradeAnswers,
  parseQuiz,
  sanitizeAnswers,
  toPublicQuestions
} from "@/lib/quiz/parse";

const SAMPLE = `# 이더리움 기초 퀴즈

인트로 문단입니다.

## 합의 알고리즘은?
힌트: 2022년 머지 이후
- [ ] PoW
- [x] PoS
- [ ] PoA

## 가스비가 필요한 이유를 서술하세요.

## 트랜잭션 필드를 모두 고르세요.
- [x] nonce
- [x] gasLimit
- [ ] blockHash
`;

describe("parseQuiz", () => {
  const parsed = parseQuiz(SAMPLE);

  it("제목과 인트로를 분리한다", () => {
    expect(parsed.title).toBe("이더리움 기초 퀴즈");
    expect(parsed.intro).toBe("인트로 문단입니다.");
  });

  it("## 하나당 문항 하나, 유형을 보기·정답 수로 판정한다", () => {
    expect(parsed.questions).toHaveLength(3);
    expect(parsed.questions.map((q) => q.type)).toEqual(["single", "text", "multiple"]);
  });

  it("정답 인덱스를 [x] 위치로 기록한다", () => {
    expect(parsed.questions[0].correct).toEqual([1]);
    expect(parsed.questions[2].correct).toEqual([0, 1]);
  });

  it("문항 본문(보기 아닌 줄)을 body로 모은다", () => {
    expect(parsed.questions[0].body).toBe("힌트: 2022년 머지 이후");
  });

  it("코드펜스 안의 ## 와 - [x] 는 무시한다", () => {
    const md = "## 질문\n```solidity\n## 주석\n- [x] 코드\n```\n- [x] 진짜 정답\n";
    const q = parseQuiz(md).questions;
    expect(q).toHaveLength(1);
    expect(q[0].options).toEqual(["진짜 정답"]);
    expect(q[0].body).toContain("## 주석");
  });

  it("문항이 없으면 빈 배열을 돌려준다", () => {
    expect(parseQuiz("# 제목만\n본문").questions).toHaveLength(0);
  });
});

describe("toPublicQuestions", () => {
  it("정답 정보를 제거한다", () => {
    const publicQ = toPublicQuestions(parseQuiz(SAMPLE).questions);
    for (const q of publicQ) {
      expect("correct" in q).toBe(false);
    }
  });
});

describe("gradeAnswers", () => {
  const questions = parseQuiz(SAMPLE).questions;

  it("객관식만 채점하고 주관식은 total에서 제외한다", () => {
    const { score, total } = gradeAnswers(questions, [1, "서술 답", [0, 1]]);
    expect(total).toBe(2);
    expect(score).toBe(2);
  });

  it("복수 선택은 정확히 일치해야 정답이다", () => {
    expect(gradeAnswers(questions, [1, null, [0]]).score).toBe(1);
    expect(gradeAnswers(questions, [1, null, [0, 1, 2]]).score).toBe(1);
  });

  it("무응답·오답은 0점 처리한다", () => {
    expect(gradeAnswers(questions, [null, null, null]).score).toBe(0);
    expect(gradeAnswers(questions, [0, null, [2]]).score).toBe(0);
  });
});

describe("sanitizeAnswers", () => {
  const questions = parseQuiz(SAMPLE).questions;

  it("정상 입력은 그대로 통과한다", () => {
    expect(sanitizeAnswers(questions, [1, "답", [1, 0]])).toEqual([1, "답", [0, 1]]);
  });

  it("배열이 아니거나 문항 수를 넘으면 거부한다", () => {
    expect(sanitizeAnswers(questions, { a: 1 })).toBeNull();
    expect(sanitizeAnswers(questions, [1, "답", [0], 9])).toBeNull();
  });

  it("범위를 벗어난 보기·잘못된 타입은 null로 바꾼다", () => {
    expect(sanitizeAnswers(questions, [99, 123, "문자열"])).toEqual([null, null, null]);
  });

  it("주관식은 4000자로 자른다", () => {
    const long = "가".repeat(5000);
    const result = sanitizeAnswers(questions, [null, long, null]);
    expect((result?.[1] as string).length).toBe(4000);
  });

  it("복수 선택 중복은 제거하고 정렬한다", () => {
    expect(sanitizeAnswers(questions, [null, null, [1, 1, 0]])?.[2]).toEqual([0, 1]);
  });
});
