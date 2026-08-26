import { METRIC_IDS, type MetricId } from "@/data/metrics";
import { VIEW_MODES, type ViewMode } from "@/lib/view-modes";

export type ShareSnapshot = {
  t: number | null;
  v: ViewMode;
  c: string | null;
  pin: { lat: number; lon: number } | null;
  m: MetricId;
  s: 1 | 10;
  z: "local" | "central";
};

export function parseShareHash(hash: string): Partial<ShareSnapshot> {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) return {};
  const q = new URLSearchParams(raw);
  const out: Partial<ShareSnapshot> = {};
  const t = q.get("t");
  if (t === "now") out.t = null;
  else if (t) {
    const ms = t.endsWith("Z") || t.includes("T") ? Date.parse(t) : Number(t);
    if (Number.isFinite(ms)) out.t = ms;
  }
  const v = q.get("v");
  if (v && (VIEW_MODES as readonly string[]).includes(v)) {
    out.v = v as ViewMode;
  }
  const c = q.get("c");
  if (c) out.c = c;
  const p = q.get("p");
  if (p) {
    const [lat, lon] = p.split(",").map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lon)) out.pin = { lat, lon };
  }
  const m = q.get("m");
  if (m && (METRIC_IDS as readonly string[]).includes(m)) {
    out.m = m as MetricId;
  }
  const s = q.get("s");
  if (s === "1" || s === "10") out.s = Number(s) as 1 | 10;
  const z = q.get("z");
  if (z === "local" || z === "central") out.z = z;
  return out;
}

export function toShareHash(snap: ShareSnapshot) {
  const q = new URLSearchParams();
  if (snap.t != null) q.set("t", new Date(snap.t).toISOString().replace(/\.\d{3}Z$/, "Z"));
  if (snap.v !== "plan") q.set("v", snap.v);
  if (snap.c) q.set("c", snap.c);
  if (snap.pin) {
    q.set(
      "p",
      `${snap.pin.lat.toFixed(3)},${snap.pin.lon.toFixed(3)}`,
    );
  }
  if (snap.m !== "hdi") q.set("m", snap.m);
  if (snap.s !== 10) q.set("s", String(snap.s));
  if (snap.z !== "local") q.set("z", snap.z);
  const s = q.toString();
  return s ? `#${s}` : "";
}
