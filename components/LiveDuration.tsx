"use client";

import { useEffect, useState } from "react";

export function LiveDuration({ liveTime }: { liveTime: number | null }) {
  const [elapsed, setElapsed] = useState("00:00:00");

  useEffect(() => {
    if (!liveTime) return;
    const start = liveTime * 1000;

    function tick() {
      const diff = Date.now() - start;
      if (diff < 0) {
        setElapsed("00:00:00");
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      const h = Math.floor(totalSeconds / 3600)
        .toString()
        .padStart(2, "0");
      const m = Math.floor((totalSeconds % 3600) / 60)
        .toString()
        .padStart(2, "0");
      const s = (totalSeconds % 60).toString().padStart(2, "0");
      setElapsed(`${h}:${m}:${s}`);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [liveTime]);

  return <span className="font-mono text-lg font-bold">{elapsed}</span>;
}
