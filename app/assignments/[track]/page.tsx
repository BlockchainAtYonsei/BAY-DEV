import { existsSync } from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import SubmissionGuide from "@/components/SubmissionGuide";
import TrackSubmissionForm from "@/components/TrackSubmissionForm";
import { findTrack } from "@/lib/tracks";
import { quizStore } from "@/lib/quizStore";

// 안내 이미지를 public/에 넣으면 재빌드 없이 바로 반영되도록 요청마다 확인한다
export const dynamic = "force-dynamic";

const GUIDE_IMAGES: Record<string, string[]> = {
  cryptozombies: [
    "guide-lesson-complete.png",
    "guide-lesson-complete.jpeg",
    "guide-lesson-complete.jpg"
  ]
};

export default async function TrackPage({
  params
}: {
  params: Promise<{ track: string }>;
}) {
  const { track: slug } = await params;
  const track = findTrack(slug);
  if (!track) notFound();

  if (track.submitMode === "quiz") {
    const quizzes = (await quizStore.listPublished()).filter(
      (quiz) => quiz.track === track.slug
    );
    return (
      <main className="shell narrow">
        <PageHeader badge={track.badge} title={track.title} description={track.description} />
        <Nav />
        <div className="trackGrid">
          {quizzes.length === 0 && (
            <p className="formGuide">아직 공개된 퀴즈가 없습니다. 곧 올라올 예정이에요.</p>
          )}
          {quizzes.map((quiz) => (
            <Link key={quiz.slug} href={`/quiz/${quiz.slug}`} className="trackCard">
              <span className="trackBadge">{quiz.badge}</span>
              <strong>{quiz.title}</strong>
              <p>문항에 응답하고 제출해 주세요. 다시 제출하면 언제든지 수정됩니다.</p>
            </Link>
          ))}
        </div>
      </main>
    );
  }

  const imageName = (GUIDE_IMAGES[track.slug] || []).find((name) =>
    existsSync(path.join(process.cwd(), "public", name))
  );

  return (
    <main className="shell narrow">
      <PageHeader badge={track.badge} title={track.title} description={track.description} />
      <Nav />
      <SubmissionGuide track={track} imageSrc={imageName ? `/${imageName}` : null} />
      <TrackSubmissionForm track={track} />
    </main>
  );
}
