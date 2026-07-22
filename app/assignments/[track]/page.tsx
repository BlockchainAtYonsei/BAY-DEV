import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import QuizModeContent from "@/components/track/QuizModeContent";
import UrlModeContent from "@/components/track/UrlModeContent";
import { findTrack } from "@/lib/tracks";

// 안내 이미지·DB 콘텐츠가 재빌드 없이 반영되도록 요청마다 확인한다
export const dynamic = "force-dynamic";

export default async function TrackPage({
  params
}: {
  params: Promise<{ track: string }>;
}) {
  const { track: slug } = await params;
  const track = findTrack(slug);
  if (!track) notFound();

  return (
    <main className="shell narrow">
      <BackButton fallback="/" label="메인으로" />
      <PageHeader badge={track.badge} title={track.title} description={track.description} />
      <Nav />
      {track.submitMode === "quiz" ? (
        <QuizModeContent track={track} />
      ) : (
        <UrlModeContent track={track} />
      )}
    </main>
  );
}
