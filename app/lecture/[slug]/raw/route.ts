import { lectureStore } from "@/lib/lectureStore";

export const dynamic = "force-dynamic";

/** HTML 형식 강의록의 원문을 그대로 서빙한다 (iframe에서 사용). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const lecture = await lectureStore.findBySlug(slug);
  if (!lecture || !lecture.published || lecture.format !== "html") {
    return new Response("Not Found", { status: 404 });
  }
  return new Response(lecture.markdown, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
