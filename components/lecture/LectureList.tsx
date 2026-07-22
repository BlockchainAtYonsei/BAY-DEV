import ContentCard from "@/components/ContentCard";
import type { Lecture } from "@/lib/lectureStore";
import { findTrack } from "@/lib/tracks";

function describe(lecture: Lecture): string {
  const trackTitle = findTrack(lecture.track)?.title || "공통";
  const interactive = lecture.format === "html" ? " · 인터랙티브" : "";
  return `${trackTitle} 트랙${interactive}`;
}

/** 게시된 학습자료 카드 목록 */
export default function LectureList({ lectures }: { lectures: Lecture[] }) {
  if (lectures.length === 0) {
    return <p className="formGuide">아직 공개된 학습자료가 없습니다. 곧 올라올 예정이에요.</p>;
  }
  return (
    <div className="trackGrid">
      {lectures.map((lecture) => (
        <ContentCard
          key={lecture.slug}
          href={`/lecture/${lecture.slug}`}
          badge={lecture.badge}
          title={lecture.title}
          description={describe(lecture)}
        />
      ))}
    </div>
  );
}
