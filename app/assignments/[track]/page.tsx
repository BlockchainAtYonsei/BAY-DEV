import { existsSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import SubmissionGuide from "@/components/SubmissionGuide";
import TrackSubmissionForm from "@/components/TrackSubmissionForm";
import { findTrack } from "@/lib/tracks";

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
