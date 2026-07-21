import Markdown from "@/components/quiz/Markdown";
import type { LectureBlock, ParsedLecture } from "@/lib/lecture/parse";

/**
 * 파싱된 강의록을 시각적으로 렌더링한다.
 * 서버/클라이언트 어디서든 쓸 수 있는 순수 표시 컴포넌트.
 */

function Block({ block }: { block: LectureBlock }) {
  switch (block.kind) {
    case "markdown":
      return <Markdown text={block.text} />;

    case "callout":
      return (
        <div className="lectureCallout">
          <Markdown text={block.text} />
        </div>
      );

    case "cards":
      return (
        <div className="lectureCards">
          {block.items.map((item, i) => (
            <div className="lectureCard" key={i}>
              {item.title && <strong>{item.title}</strong>}
              <Markdown text={item.body} />
            </div>
          ))}
        </div>
      );

    case "flow":
      return (
        <div className="lectureFlow">
          {block.items.map((item, i) => (
            <div className="lectureFlowItem" key={i}>
              <div className="lectureCard">
                {item.title && <strong>{item.title}</strong>}
                <Markdown text={item.body} />
              </div>
              {i < block.items.length - 1 && (
                <span className="lectureFlowArrow" aria-hidden="true">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      );

    case "steps":
      return (
        <ol className="lectureSteps">
          {block.items.map((item, i) => (
            <li key={i}>
              <span className="lectureStepNumber">{i + 1}</span>
              <div>
                {item.title && <strong>{item.title}</strong>}
                <Markdown text={item.body} />
              </div>
            </li>
          ))}
        </ol>
      );

    case "compare":
      return (
        <div className="lectureCompare">
          {block.items.map((item, i) => (
            <div className={i === 0 ? "lectureCard" : "lectureCard lectureCardAccent"} key={i}>
              {item.title && <strong>{item.title}</strong>}
              <Markdown text={item.body} />
            </div>
          ))}
        </div>
      );
  }
}

export default function LectureView({ lecture }: { lecture: ParsedLecture }) {
  return (
    <article className="lectureView">
      {lecture.intro && (
        <div className="lectureIntro">
          <Markdown text={lecture.intro} />
        </div>
      )}
      {lecture.sections.map((section, i) => (
        <section className="lectureSection" key={i}>
          {section.label && <span className="lectureLabel">{section.label}</span>}
          <h2>{section.title}</h2>
          {section.blocks.map((block, j) => (
            <Block block={block} key={j} />
          ))}
        </section>
      ))}
    </article>
  );
}
