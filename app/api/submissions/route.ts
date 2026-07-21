import { NextResponse } from "next/server";
import { getWalletSession } from "@/lib/session";
import { parseSubmissionInput } from "@/lib/validation";
import { submissionStore } from "@/lib/submissionStore";
import { userStore } from "@/lib/userStore";
import { getCurrentWeekKey } from "@/lib/week";
import { findTrack } from "@/lib/tracks";

export async function GET(request: Request) {
  const session = await getWalletSession();
  if (!session) {
    return NextResponse.json({ submission: null, history: [] }, { status: 401 });
  }

  const week = getCurrentWeekKey();
  const track = findTrack(new URL(request.url).searchParams.get("track"));
  const all = await submissionStore.listByWallet(session.wallet);
  const history = track ? all.filter((item) => item.track === track.slug) : all;
  const submission = track
    ? history.find((item) => item.week === week) || null
    : null;
  return NextResponse.json({ submission, history, week });
}

export async function POST(request: Request) {
  const session = await getWalletSession();
  if (!session) {
    return NextResponse.json({ error: "지갑 로그인이 필요합니다." }, { status: 401 });
  }

  const user = await userStore.findByWallet(session.wallet);
  if (!user) {
    return NextResponse.json({ error: "이름 등록이 필요합니다." }, { status: 403 });
  }

  const parsed = parseSubmissionInput(await request.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const submission = await submissionStore.upsertByWalletAndWeek(
    {
      wallet: session.wallet,
      name: user.name,
      track: parsed.input.track.slug,
      zombieUrl: parsed.input.zombieUrl,
      note: parsed.input.note
    },
    getCurrentWeekKey()
  );
  return NextResponse.json({ submission });
}
