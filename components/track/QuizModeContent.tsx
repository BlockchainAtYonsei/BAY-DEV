import ContentCard from "@/components/ContentCard";
import { quizStore } from "@/lib/quizStore";
import type { Track } from "@/lib/tracks";

/** 퀴즈 제출 트랙: 트랙 소속 퀴즈 카드 목록 */
export default async function QuizModeContent({ track }: { track: Track }) {
  const quizzes = (await quizStore.listPublished()).filter(
    (quiz) => quiz.track === track.slug
  );
  return (
    <>
      <h2 className="sectionTitle">과제 제출</h2>
      <div className="trackGrid">
        {quizzes.length === 0 && (
          <p className="formGuide">아직 공개된 퀴즈가 없습니다. 곧 올라올 예정이에요.</p>
        )}
        {quizzes.map((quiz) => (
          <ContentCard
            key={quiz.slug}
            href={`/quiz/${quiz.slug}`}
            badge={quiz.badge}
            title={quiz.title}
            description="문항에 응답하고 제출해 주세요. 다시 제출하면 언제든지 수정됩니다."
          />
        ))}
      </div>
    </>
  );
}
