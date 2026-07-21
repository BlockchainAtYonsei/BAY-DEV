"use client";

import { FormEvent, useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import SubmissionHistory from "@/components/SubmissionHistory";
import { useSession } from "@/hooks/useSession";
import { useMySubmissions } from "@/hooks/useMySubmissions";
import type { Track } from "@/lib/tracks";
import { formatWeekRange, getCurrentWeekKey } from "@/lib/week";

type Props = {
  track: Track;
};

export default function TrackSubmissionForm({ track }: Props) {
  const auth = useSession();
  const loggedIn = Boolean(auth.session?.name);
  const { submission, history, applyUpserted } = useMySubmissions(loggedIn, track.slug);

  const [zombieUrl, setZombieUrl] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const currentWeek = getCurrentWeekKey();
  const canSubmit = loggedIn && zombieUrl.trim().length > 8;

  useEffect(() => {
    setZombieUrl(submission?.zombieUrl || "");
    setNote(submission?.note || "");
  }, [submission]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track: track.slug, zombieUrl, note })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      applyUpserted(data.submission);
      setStatus("이번 주 제출이 저장되었습니다. 다시 제출하면 이번 주 제출만 수정됩니다.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "제출에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthGate auth={auth}>
      <form className="submissionForm" onSubmit={submit}>
        <div>
          <span className="label">이번 주</span>
          <strong>{formatWeekRange(currentWeek)}</strong>
        </div>
        <label>
          {track.urlLabel}
          <input
            inputMode="url"
            placeholder={track.urlPlaceholder}
            value={zombieUrl}
            onChange={(event) => setZombieUrl(event.target.value)}
          />
        </label>
        <label>
          메모 (선택)
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <button className="primaryButton wide" disabled={!canSubmit || busy} type="submit">
          {submission ? "이번 주 제출 수정" : "제출"}
        </button>
        {status && <p className="status">{status}</p>}
      </form>

      <SubmissionHistory title={`내 제출 내역 — ${track.title}`} submissions={history} />
    </AuthGate>
  );
}
