import Link from "next/link";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import { lectureStore } from "@/lib/lectureStore";
import { findTrack } from "@/lib/tracks";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "학습자료 — BAY 개발팀"
};

export default async function LecturesPage() {
  // 트랙 미지정(임베드 전용) 자료는 목록에 노출하지 않는다
  const lectures = (await lectureStore.listPublished()).filter(
    (lecture) => lecture.track !== ""
  );

  return (
    <main className="shell narrow">
      <PageHeader
        badge="학습 자료"
        title="학습자료"
        description="회차별 강의 내용을 웹에서 바로 볼 수 있습니다."
      />
      <Nav />
      <div className="trackGrid">
        {lectures.length === 0 && (
          <p className="formGuide">아직 공개된 학습자료가 없습니다. 곧 올라올 예정이에요.</p>
        )}
        {lectures.map((lecture) => (
          <Link key={lecture.slug} href={`/lecture/${lecture.slug}`} className="trackCard">
            <span className="trackBadge">{lecture.badge}</span>
            <strong>{lecture.title}</strong>
            <p>
              {findTrack(lecture.track)?.title || "공통"} 트랙
              {lecture.format === "html" ? " · 인터랙티브" : ""}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
