import Link from "next/link";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import { TRACKS } from "@/lib/tracks";

export default function HomeLanding() {
  return (
    <main className="shell narrow">
      <PageHeader
        logoSrc="/logo-mark.png"
        title="BAY 개발팀"
        description="과제를 선택해서 결과물을 제출해 주세요. 지갑 로그인은 제출할 때 하면 됩니다."
      />
      <Nav />
      <div className="trackGrid">
        {TRACKS.map((track) => (
          <Link key={track.slug} href={`/assignments/${track.slug}`} className="trackCard">
            <span className="trackBadge">{track.badge}</span>
            <strong>{track.title}</strong>
            <p>{track.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
