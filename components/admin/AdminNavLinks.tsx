import Link from "next/link";

const LINKS = [
  { href: "/admin", label: "제출 현황" },
  { href: "/admin/quizzes", label: "퀴즈 관리" },
  { href: "/admin/lectures", label: "학습자료 관리" }
] as const;

/** 관리자 화면 간 이동 링크 — 현재 화면은 제외하고 보여준다 */
export default function AdminNavLinks({ current }: { current: string }) {
  return (
    <>
      {LINKS.filter((link) => link.href !== current).map((link) => (
        <Link key={link.href} className="ghostButton" href={link.href}>
          {link.label}
        </Link>
      ))}
    </>
  );
}
