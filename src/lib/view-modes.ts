export const VIEW_MODES = ["plan", "pole", "rim", "transverse"] as const;

export type ViewMode = (typeof VIEW_MODES)[number];

export type ViewPreset = {
  id: ViewMode;
  label: string;
  shortLabel: string;
  hint: string;
  tilt: number;
  bank: number;
  scale: number;
  /** Screen-space vertical framing as a fraction of disc radius. Positive lowers the pole. */
  camY: number;
  /** Pull the disc toward the camera, in pixels. */
  camZ: number;
  /** SVG atan2 degrees for “ahead” when focusing a country. */
  lookAngle: number;
};

export const VIEW_PRESETS: Record<ViewMode, ViewPreset> = {
  plan: {
    id: "plan",
    label: "Overhead",
    shortLabel: "Overhead",
    hint: "Looking down the polar axis",
    tilt: 0,
    bank: 0,
    scale: 1,
    camY: 0,
    camZ: 0,
    lookAngle: 90,
  },
  pole: {
    id: "pole",
    label: "From the pole",
    shortLabel: "Pole",
    hint: "From the centre, looking out to the ice",
    tilt: 60,
    bank: 0,
    scale: 2.08,
    camY: 0.56,
    camZ: 36,
    lookAngle: -90,
  },
  rim: {
    id: "rim",
    label: "From the rim",
    shortLabel: "Rim",
    hint: "From the outer ice, looking in toward the pole",
    tilt: 58,
    bank: 0,
    scale: 1.22,
    camY: 0,
    camZ: 0,
    lookAngle: 90,
  },
  transverse: {
    id: "transverse",
    label: "Transverse",
    shortLabel: "Transverse",
    hint: "Edge-on across a meridian — turn to bring another face forward",
    tilt: 12,
    bank: 68,
    scale: 1.52,
    camY: 0,
    camZ: 0,
    lookAngle: 0,
  },
};

export function wrapDeg(deg: number) {
  return ((deg % 360) + 360) % 360;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function nearEdgeAngle(mode: ViewMode) {
  return VIEW_PRESETS[mode].lookAngle;
}

export const DISK_RIM_SEGMENTS = 72;
