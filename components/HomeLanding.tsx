import ContentCard from "@/components/ContentCard";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import { TRACKS } from "@/lib/tracks";

type QuizCard = {
  slug: string;
  title: string;
  badge: string;
};

type Props = {
  quizzes?: QuizCard[];
};

export default function HomeLanding({ quizzes = [] }: Props) {
  return (
    <main className="shell narrow">
      <PageHeader
        logoSrc="/logo-mark.png"
        title="BAY 개발팀"
        description="과제를 선택해서 결과물을 제출해 주세요. 지갑 로그인은 제출할 때 하면 됩니다."
      />
      <Nav />
      <div className="trackGrid">
        {TRACKS.map((track) => (
          <ContentCard
            key={track.slug}
            href={`/assignments/${track.slug}`}
            badge={track.badge}
            title={track.title}
            description={track.description}
          />
        ))}
        {quizzes.map((quiz) => (
          <ContentCard
            key={quiz.slug}
            href={`/quiz/${quiz.slug}`}
            badge={quiz.badge}
            title={quiz.title}
            description="문항에 응답하고 제출해 주세요."
          />
        ))}
      </div>
    </main>
  );
}
