import { NextResponse } from "next/server";
import { getWalletSession, isAdmin } from "@/lib/session";
import { commentStore } from "@/lib/commentStore";

type Params = { params: Promise<{ slug: string; id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getWalletSession();
  if (!session) {
    return NextResponse.json({ error: "지갑 로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const comment = await commentStore.findById(id);
  if (!comment || comment.deletedAt) {
    return NextResponse.json({ error: "댓글을 찾을 수 없습니다." }, { status: 404 });
  }

  const admin = await isAdmin();
  const isOwner = comment.wallet === session.wallet;
  if (!admin && !isOwner) {
    return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
  }

  await commentStore.softDelete(id);
  return NextResponse.json({ ok: true });
}
