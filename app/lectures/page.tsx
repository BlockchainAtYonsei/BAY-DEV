import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import LectureList from "@/components/lecture/LectureList";
import { lectureStore } from "@/lib/lectureStore";

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
      <LectureList lectures={lectures} />
    </main>
  );
}
