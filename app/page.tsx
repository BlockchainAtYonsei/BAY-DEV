import HomeLanding from "@/components/HomeLanding";
import { quizStore } from "@/lib/quizStore";

export const dynamic = "force-dynamic";

export default async function Home() {
  const quizzes = await quizStore.listPublished();
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
