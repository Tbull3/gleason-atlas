import { useEffect, useRef } from "react";
import { useAtlas } from "@/lib/atlas-store";
import { parseShareHash, toShareHash } from "@/lib/share";

export function AtlasPermalink() {
  const hydrated = useRef(false);
  const metric = useAtlas((s) => s.metric);
  const viewMode = useAtlas((s) => s.viewMode);
  const selectedKey = useAtlas((s) => s.selectedKey);
  const clockMs = useAtlas((s) => s.clockMs);
  const viewerPin = useAtlas((s) => s.viewerPin);
  const bodyScale = useAtlas((s) => s.bodyScale);
  const clockZone = useAtlas((s) => s.clockZone);
  const applyShare = useAtlas((s) => s.applyShare);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (typeof window === "undefined") return;
    const snap = parseShareHash(window.location.hash);
    if (Object.keys(snap).length) applyShare(snap);
  }, [applyShare]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (typeof window === "undefined") return;
    const hash = toShareHash({
      t: clockMs,
      v: viewMode,
      c: selectedKey,
      pin: viewerPin,
      m: metric,
      s: bodyScale,
      z: clockZone,
    });
    const next = `${window.location.pathname}${window.location.search}${hash}`;
    const cur = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== cur) window.history.replaceState(null, "", next);
  }, [
    metric,
    viewMode,
    selectedKey,
    clockMs,
    viewerPin,
    bodyScale,
    clockZone,
  ]);

  return null;
}
