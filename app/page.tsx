import HomeLanding from "@/components/HomeLanding";
import { quizStore } from "@/lib/quizStore";

export const dynamic = "force-dynamic";

export default async function Home() {
  // 트랙에 소속된 퀴즈는 해당 트랙 페이지에서 노출하고, 홈에는 트랙 미지정 퀴즈만 보여준다
  const quizzes = (await quizStore.listPublished()).filter((quiz) => !quiz.track);
  return (
    <HomeLanding
      quizzes={quizzes.map((quiz) => ({
        slug: quiz.slug,
        title: quiz.title,
        badge: quiz.badge
      }))}
    />
  );
}
