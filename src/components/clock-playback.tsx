import { useEffect, useRef } from "react";
import { useAtlas } from "@/lib/atlas-store";

/** 3× / 10× run 3 or 10 minutes of sky per real second. */
const TICKS_PER_SEC = 12;

export function ClockPlayback() {
  const rate = useAtlas((s) => s.clockRate);
  const timer = useRef<number>(0);

  useEffect(() => {
    if (rate === 1) return;
    const step = (rate * 60 * 1000) / TICKS_PER_SEC;
    timer.current = window.setInterval(() => {
      useAtlas.setState((s) => ({
        clockMs: (s.clockMs ?? Date.now()) + step,
      }));
    }, 1000 / TICKS_PER_SEC);
    return () => window.clearInterval(timer.current);
  }, [rate]);

  return null;
}
