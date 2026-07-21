"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "과제" },
  { href: "/my", label: "내 제출" }
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="tabs">
      {TABS.map((tab) => {
        const active =
          tab.href === "/" ? pathname === "/" || pathname.startsWith("/assignments") : pathname.startsWith(tab.href);
        return (
          <Link key={tab.href} href={tab.href} className={active ? "tab tabActive" : "tab"}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
