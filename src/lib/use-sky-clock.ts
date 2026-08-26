import { useEffect, useMemo, useState } from "react";
import { skyAt } from "@/lib/astro";
import { useAtlas } from "@/lib/atlas-store";

export function useSkyNow() {
  const clockMs = useAtlas((s) => s.clockMs);
  const [live, setLive] = useState<Date | null>(null);

  useEffect(() => {
    if (clockMs != null) return;
    setLive(new Date());
    const id = window.setInterval(() => setLive(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [clockMs]);

  const now = clockMs != null ? new Date(clockMs) : live;
  const sky = useMemo(() => (now ? skyAt(now) : null), [now?.getTime()]);
  return { now, sky, isLive: clockMs == null };
}
