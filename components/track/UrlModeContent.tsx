import { existsSync } from "fs";
import path from "path";
import SubmissionGuide from "@/components/SubmissionGuide";
import TrackSubmissionForm from "@/components/TrackSubmissionForm";
import type { Track } from "@/lib/tracks";

// 안내 이미지를 public/에 넣으면 재빌드 없이 바로 반영되도록 요청마다 확인한다
const GUIDE_IMAGES: Record<string, string[]> = {
  cryptozombies: [
    "guide-lesson-complete.png",
    "guide-lesson-complete.jpeg",
    "guide-lesson-complete.jpg"
  ]
};

function findGuideImage(trackSlug: string): string | null {
  const name = (GUIDE_IMAGES[trackSlug] || []).find((candidate) =>
    existsSync(path.join(process.cwd(), "public", candidate))
  );
  return name ? `/${name}` : null;
}

/** URL 제출 트랙: 제출 가이드 + 링크 제출 폼 */
export default function UrlModeContent({ track }: { track: Track }) {
  return (
    <>
      <SubmissionGuide track={track} imageSrc={findGuideImage(track.slug)} />
      <TrackSubmissionForm track={track} />
    </>
  );
}
