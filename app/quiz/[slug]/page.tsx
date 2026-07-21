import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import QuizForm from "@/components/quiz/QuizForm";
import { quizStore } from "@/lib/quizStore";

export const dynamic = "force-dynamic";

export default async function QuizPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const quiz = await quizStore.findBySlug(slug);
  if (!quiz || !quiz.published) notFound();

  return (
    <main className="shell narrow">
      <PageHeader
        badge={quiz.badge}
        title={quiz.title}
        description="지갑으로 로그인한 뒤 문항에 응답하고 제출해 주세요. 다시 제출하면 언제든지 수정됩니다."
      />
      <Nav />
      <QuizForm slug={slug} />
    </main>
  );
}
