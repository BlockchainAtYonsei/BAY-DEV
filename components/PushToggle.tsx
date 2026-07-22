"use client";

import { useCallback, useEffect, useState } from "react";

type PushState = "loading" | "unsupported" | "denied" | "off" | "on" | "busy";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((ch) => ch.charCodeAt(0)));
}

/** 답글 푸시 알림 켜기/끄기 토글. 로그인한 상태에서만 렌더할 것. */
export default function PushToggle() {
  const [state, setState] = useState<PushState>("loading");

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        setState(sub ? "on" : "off");
      } catch {
        setState("unsupported");
      }
    })();
  }, []);

  const toggle = useCallback(async () => {
    if (state !== "on" && state !== "off") return;
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      if (state === "off") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setState(permission === "denied" ? "denied" : "off");
          return;
        }
        const keyRes = await fetch("/api/push");
        if (!keyRes.ok) throw new Error("push not configured");
        const { publicKey } = await keyRes.json();
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
        const res = await fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON())
        });
        if (!res.ok) throw new Error("subscribe failed");
        setState("on");
      } else {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint })
          });
          await sub.unsubscribe();
        }
        setState("off");
      }
    } catch {
      setState("off");
    }
  }, [state]);

  if (state === "loading" || state === "unsupported") return null;
  if (state === "denied") {
    return (
      <small className="quizHint">
        🔕 브라우저 설정에서 이 사이트의 알림이 차단되어 있어요.
      </small>
    );
  }

  return (
    <button
      type="button"
      className="ghostButton pushToggle"
      disabled={state === "busy"}
      onClick={toggle}
      title="내 글에 답글이 달리면 브라우저 알림을 받습니다"
    >
      {state === "on" ? "🔔 답글 알림 켜짐" : "🔕 답글 알림 받기"}
    </button>
  );
}
