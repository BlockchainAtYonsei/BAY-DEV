import BackButton from "@/components/BackButton";

type Props = {
  slug: string;
  title: string;
};

/** HTML 인터랙티브 자료를 전체 화면 iframe으로 보여주는 껍데기 (상단 바 포함) */
export default function LectureFrame({ slug, title }: Props) {
  return (
    <main className="lectureFrameShell">
      <div className="lectureFrameBar">
        <BackButton fallback="/lectures" label="학습자료" />
        <span>{title}</span>
      </div>
      <iframe className="lectureFrame" src={`/lecture/${slug}/raw`} title={title} />
    </main>
  );
}
