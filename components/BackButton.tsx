"use client";

import { useRouter } from "next/navigation";

type Props = {
  /** 방문 기록이 없을 때 이동할 경로 */
  fallback?: string;
  label?: string;
};

export default function BackButton({ fallback = "/", label = "뒤로" }: Props) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }

  return (
    <button className="backButton" type="button" onClick={goBack}>
      ← {label}
    </button>
  );
}
