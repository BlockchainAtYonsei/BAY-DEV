import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { jsonError, requireWallet } from "@/lib/api/guards";
import { commentStore } from "@/lib/commentStore";

type Params = { params: Promise<{ slug: string; id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const sessionGuard = await requireWallet();
  if (!sessionGuard.ok) return sessionGuard.res;
  const session = sessionGuard.value;

  const { id } = await params;
  const comment = await commentStore.findById(id);
  if (!comment || comment.deletedAt) {
    return jsonError("댓글을 찾을 수 없습니다.", 404);
  }

  const admin = await isAdmin();
  const isOwner = comment.wallet === session.wallet;
  if (!admin && !isOwner) {
    return jsonError("삭제 권한이 없습니다.", 403);
  }

  await commentStore.softDelete(id);
  return NextResponse.json({ ok: true });
}
