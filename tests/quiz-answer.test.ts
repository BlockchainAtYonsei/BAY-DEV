import { describe, expect, it } from "vitest";
import { answerText, isAnswered } from "@/lib/quiz/answerText";
import type { PublicQuizQuestion } from "@/lib/quiz/parse";

const single: PublicQuizQuestion = {
  index: 0,
  prompt: "q",
  body: "",
  type: "single",
  options: ["A", "B"]
};
const multiple: PublicQuizQuestion = { ...single, type: "multiple", options: ["A", "B", "C"] };
const text: PublicQuizQuestion = { ...single, type: "text", options: [] };

describe("answerText", () => {
  it("단일 선택은 보기 텍스트를 돌려준다", () => {
    expect(answerText(single, 1)).toBe("B");
    expect(answerText(single, null)).toBe("");
    expect(answerText(single, 9)).toBe("");
  });

  it("복수 선택은 보기들을 쉼표로 잇는다", () => {
    expect(answerText(multiple, [0, 2])).toBe("A, C");
    expect(answerText(multiple, [])).toBe("");
  });

  it("주관식은 트림한 본문을 돌려준다", () => {
    expect(answerText(text, "  답  ")).toBe("답");
    expect(answerText(text, 3)).toBe("");
  });
});

describe("isAnswered", () => {
  it("null·빈 문자열·빈 배열은 무응답이다", () => {
    expect(isAnswered(null)).toBe(false);
    expect(isAnswered("")).toBe(false);
    expect(isAnswered([])).toBe(false);
  });

  it("0번 보기 선택도 응답이다", () => {
    expect(isAnswered(0)).toBe(true);
    expect(isAnswered([0])).toBe(true);
    expect(isAnswered("답")).toBe(true);
  });
});
