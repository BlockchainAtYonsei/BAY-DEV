import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/guards";
import { submissionStore } from "@/lib/submissionStore";

export async function GET() {
  const adminGuard = await requireAdmin();
  if (!adminGuard.ok) return adminGuard.res;

  const submissions = await submissionStore.list();
  return NextResponse.json({ submissions });
}
