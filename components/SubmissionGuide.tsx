import type { Track } from "@/lib/tracks";

type Props = {
  track: Track;
  imageSrc: string | null;
};

export default function SubmissionGuide({ track, imageSrc }: Props) {
  return (
    <section className="guide">
      <h2>제출 방법</h2>
      <ol>
        {track.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {imageSrc && (
        <figure>
          <img
            src={imageSrc}
            alt="크립토좀비 레슨 완료 화면. 가운데의 파란색 공유 링크를 복사해서 제출합니다."
          />
          <figcaption>완료 화면 예시 — 가운데 파란색 링크를 복사해서 제출하면 됩니다.</figcaption>
        </figure>
      )}
    </section>
  );
}
