import { describe, expect, it } from "vitest";
import { isHtmlFileName, slugFromFileName } from "@/lib/client/file";
import { formatWeekRange, weekKeyFromDate } from "@/lib/week";

describe("slugFromFileName", () => {
  it("확장자를 떼고 소문자·숫자·하이픈으로 정규화한다", () => {
    expect(slugFromFileName("Week1 Review.md")).toBe("week1-review");
    expect(slugFromFileName("ETH_Full_Cycle.html")).toBe("eth-full-cycle");
    expect(slugFromFileName("한글파일.md")).toBe("");
  });
});

describe("isHtmlFileName", () => {
  it("html/htm 확장자만 참이다", () => {
    expect(isHtmlFileName("sim.html")).toBe(true);
    expect(isHtmlFileName("sim.HTM")).toBe(true);
    expect(isHtmlFileName("doc.md")).toBe(false);
  });
});

describe("week (금요일 시작 ~ 목요일 마감, KST)", () => {
  it("같은 주기(금~목)는 같은 키를 갖는다", () => {
    // 2026-07-17(금) ~ 2026-07-23(목) 주기
    const friday = new Date("2026-07-17T00:00:00+09:00");
    const thursday = new Date("2026-07-23T23:59:59+09:00");
    expect(weekKeyFromDate(friday)).toBe(weekKeyFromDate(thursday));
  });

  it("목요일 마감 직후(금요일 0시)는 다음 주기로 넘어간다", () => {
    const thursday = new Date("2026-07-23T23:59:59+09:00");
    const nextFriday = new Date("2026-07-24T00:00:00+09:00");
    expect(weekKeyFromDate(thursday)).not.toBe(weekKeyFromDate(nextFriday));
  });

  it("주기 표시 문자열은 금~목 날짜를 보여준다", () => {
    const key = weekKeyFromDate(new Date("2026-07-20T12:00:00+09:00"));
    expect(formatWeekRange(key)).toBe("7/17 ~ 7/23");
  });
});
