"use client";

import { useMemo } from "react";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import AuthGate from "@/components/AuthGate";
import SubmissionHistory from "@/components/SubmissionHistory";
import { useSession } from "@/hooks/useSession";
import { useMySubmissions } from "@/hooks/useMySubmissions";
import type { Submission } from "@/lib/types";
import { findTrack } from "@/lib/tracks";

export default function MySubmissionsView() {
  const auth = useSession();
  const loggedIn = Boolean(auth.session?.name);
  const { history } = useMySubmissions(loggedIn);

  const byTrack = useMemo(() => {
    const groups = new Map<string, Submission[]>();
    for (const item of history) {
      const list = groups.get(item.track) || [];
      list.push(item);
      groups.set(item.track, list);
    }
    return [...groups.entries()];
  }, [history]);

  return (
    <main className="shell narrow">
      <PageHeader title="내 제출" description="지금까지 제출한 과제를 확인할 수 있습니다." />
      <Nav />
      <AuthGate auth={auth}>
        {history.length === 0 ? (
          <section className="submissionForm">
            <p className="formGuide">아직 제출한 과제가 없습니다.</p>
          </section>
        ) : (
          byTrack.map(([slug, items]) => (
            <SubmissionHistory
              key={slug}
              title={`${findTrack(slug)?.title || slug} — ${items.length}건`}
              submissions={items}
            />
          ))
        )}
      </AuthGate>
    </main>
  );
}
