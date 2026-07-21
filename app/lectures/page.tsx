import Link from "next/link";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import { lectureStore } from "@/lib/lectureStore";
import { findTrack } from "@/lib/tracks";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "강의록 — BAY 개발팀"
};

export default async function LecturesPage() {
  const lectures = await lectureStore.listPublished();

  return (
    <main className="shell narrow">
      <PageHeader
        badge="학습 자료"
        title="강의록"
        description="회차별 강의 내용을 웹에서 바로 볼 수 있습니다."
      />
      <Nav />
      <div className="trackGrid">
        {lectures.length === 0 && (
          <p className="formGuide">아직 공개된 강의록이 없습니다. 곧 올라올 예정이에요.</p>
        )}
        {lectures.map((lecture) => (
          <Link key={lecture.slug} href={`/lecture/${lecture.slug}`} className="trackCard">
            <span className="trackBadge">{lecture.badge}</span>
            <strong>{lecture.title}</strong>
            <p>
              {findTrack(lecture.track)
                ? `${findTrack(lecture.track)!.title} 트랙`
                : "공통 자료"}
              {lecture.format === "html" ? " · 인터랙티브" : ""}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
