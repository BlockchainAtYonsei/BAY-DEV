import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import LectureView from "@/components/lecture/LectureView";
import { parseLecture } from "@/lib/lecture/parse";
import { lectureStore } from "@/lib/lectureStore";

export const dynamic = "force-dynamic";

export default async function LecturePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lecture = await lectureStore.findBySlug(slug);
  if (!lecture || !lecture.published) notFound();

  // 인터랙티브 HTML 자료는 전체 화면 iframe으로 보여준다
  if (lecture.format === "html") {
    return (
      <main className="lectureFrameShell">
        <div className="lectureFrameBar">
          <BackButton fallback="/lectures" label="학습자료" />
          <span>{lecture.title}</span>
        </div>
        <iframe
          className="lectureFrame"
          src={`/lecture/${lecture.slug}/raw`}
          title={lecture.title}
        />
      </main>
    );
  }

  const parsed = parseLecture(lecture.markdown);

  return (
    <main className="shell lectureShell">
      <BackButton fallback="/lectures" label="학습자료 목록" />
      <PageHeader
        badge={lecture.badge}
        title={parsed.title || lecture.title}
        description=""
      />
      <Nav />
      <LectureView lecture={parsed} />
    </main>
  );
}
