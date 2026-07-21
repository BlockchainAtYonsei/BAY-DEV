import { notFound } from "next/navigation";
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

  const parsed = parseLecture(lecture.markdown);

  return (
    <main className="shell lectureShell">
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
