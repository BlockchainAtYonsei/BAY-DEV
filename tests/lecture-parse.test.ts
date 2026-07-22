import { describe, expect, it } from "vitest";
import { parseLecture } from "@/lib/lecture/parse";

const SAMPLE = `# 강의 제목

인트로 문단.

## 첫 섹션
:라벨 개념 ①

일반 문단.

:::cards
### 카드 A
내용 A
### 카드 B
내용 B
:::

## 둘째 섹션

:::callout
강조 문장
:::

:::embed
/lecture/sim/raw
:::
`;

describe("parseLecture", () => {
  const parsed = parseLecture(SAMPLE);

  it("제목·인트로·섹션을 분리한다", () => {
    expect(parsed.title).toBe("강의 제목");
    expect(parsed.intro).toBe("인트로 문단.");
    expect(parsed.sections.map((s) => s.title)).toEqual(["첫 섹션", "둘째 섹션"]);
  });

  it(":라벨 은 섹션 라벨로 흡수한다", () => {
    expect(parsed.sections[0].label).toBe("개념 ①");
    expect(parsed.sections[1].label).toBe("");
  });

  it("컨테이너 밖 내용은 markdown 블록, :::cards 는 ### 단위 아이템", () => {
    const blocks = parsed.sections[0].blocks;
    expect(blocks[0]).toEqual({ kind: "markdown", text: "일반 문단." });
    expect(blocks[1]).toMatchObject({
      kind: "cards",
      items: [
        { title: "카드 A", body: "내용 A" },
        { title: "카드 B", body: "내용 B" }
      ]
    });
  });

  it("callout은 본문 그대로, embed는 URL을 src로 담는다", () => {
    const blocks = parsed.sections[1].blocks;
    expect(blocks[0]).toEqual({ kind: "callout", text: "강조 문장" });
    expect(blocks[1]).toEqual({ kind: "embed", src: "/lecture/sim/raw" });
  });

  it("코드펜스 안의 ## 는 섹션으로 쪼개지 않는다", () => {
    const md = "## 섹션\n```bash\n## 주석\n:::cards\n```\n끝 문단\n";
    const p = parseLecture(md);
    expect(p.sections).toHaveLength(1);
    const text = (p.sections[0].blocks[0] as { text: string }).text;
    expect(text).toContain("## 주석");
    expect(text).toContain("끝 문단");
  });

  it("닫히지 않은 컨테이너는 markdown으로 살린다", () => {
    const p = parseLecture("## 섹션\n:::cards\n### 제목\n내용\n");
    expect(p.sections[0].blocks[0].kind).toBe("markdown");
  });

  it("섹션이 없으면 sections가 빈 배열이다 (검증에서 거부하는 케이스)", () => {
    expect(parseLecture("# 제목\n그냥 글").sections).toHaveLength(0);
  });
});
