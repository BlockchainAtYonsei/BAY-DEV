"use client";

import { useEffect, useRef } from "react";
import type { FireworksEngine } from "@/lib/fireworks/engine";

export default function FireworksCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let engine: FireworksEngine | undefined;
    let disposed = false;

    // three.js는 무거우니 마운트 시점에만 로드한다
    import("@/lib/fireworks/engine").then(({ FireworksEngine }) => {
      if (disposed || !ref.current) return;
      engine = new FireworksEngine(ref.current);
    });

    return () => {
      disposed = true;
      engine?.dispose();
    };
  }, []);

  return <canvas ref={ref} className="fireworks" aria-hidden="true" />;
}
