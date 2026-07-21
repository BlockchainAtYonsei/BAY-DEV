"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "과제" },
  { href: "/lectures", label: "학습자료" },
  { href: "/my", label: "내 제출" }
];

function isActive(href: string, pathname: string) {
  if (href === "/") {
    return (
      pathname === "/" || pathname.startsWith("/assignments") || pathname.startsWith("/quiz")
    );
  }
  if (href === "/lectures") {
    // 목록(/lectures)과 상세(/lecture/[slug]) 모두 학습자료 탭으로 취급
    return pathname.startsWith("/lecture");
  }
  return pathname.startsWith(href);
}

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="tabs">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={isActive(tab.href, pathname) ? "tab tabActive" : "tab"}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
