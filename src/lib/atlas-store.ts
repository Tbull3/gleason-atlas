import { create } from "zustand";
import type { MetricId } from "@/data/metrics";
import { wrapDeg, type ViewMode } from "@/lib/view-modes";

function wrapLon(lon: number) {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

type AtlasState = {
  metric: MetricId;
  selectedKey: string | null;
  hoveredKey: string | null;
  rotation: number;
  viewMode: ViewMode;
  turn: number;
  searchQuery: string;
  focusToken: number;
  measureMode: boolean;
  clockZone: "local" | "central";
  clockOpen: boolean;
  clockMs: number | null;
  viewerPin: { lat: number; lon: number; label: string } | null;
  placingPin: boolean;
  setMetric: (metric: MetricId) => void;
  setSelectedKey: (selectedKey: string | null) => void;
  setHoveredKey: (hoveredKey: string | null) => void;
  setRotation: (rotation: number | ((current: number) => number)) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setTurn: (turn: number | ((current: number) => number)) => void;
  setSearchQuery: (searchQuery: string) => void;
  focusCountry: (key: string) => void;
  setMeasureMode: (measureMode: boolean | ((current: boolean) => boolean)) => void;
  setClockZone: (clockZone: "local" | "central") => void;
  setClockOpen: (clockOpen: boolean | ((current: boolean) => boolean)) => void;
  setClockMs: (clockMs: number | null) => void;
  setViewerPin: (
    pin: { lat: number; lon: number; label: string } | null,
  ) => void;
  setPlacingPin: (placingPin: boolean) => void;
};

export const useAtlas = create<AtlasState>((set) => ({
  metric: "hdi",
  selectedKey: null,
  hoveredKey: null,
  rotation: -20,
  viewMode: "plan",
  turn: 0,
  searchQuery: "",
  focusToken: 0,
  measureMode: false,
  clockZone: "local",
  clockOpen: false,
  clockMs: null,
  viewerPin: null,
  placingPin: false,
  setMetric: (metric) => set({ metric }),
  setSelectedKey: (selectedKey) => set({ selectedKey }),
  setHoveredKey: (hoveredKey) => set({ hoveredKey }),
  setRotation: (rotation) =>
    set((s) => ({
      rotation: wrapLon(
        typeof rotation === "function" ? rotation(s.rotation) : rotation,
      ),
    })),
  setViewMode: (viewMode) =>
    set((s) => ({
      viewMode,
      measureMode: viewMode === "plan" ? s.measureMode : false,
      placingPin: viewMode === "plan" ? s.placingPin : false,
    })),
  setTurn: (turn) =>
    set((s) => ({
      turn: wrapDeg(typeof turn === "function" ? turn(s.turn) : turn),
    })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setMeasureMode: (measureMode) =>
    set((s) => {
      const next =
        typeof measureMode === "function"
          ? measureMode(s.measureMode)
          : measureMode;
      return {
        measureMode: next,
        placingPin: next ? false : s.placingPin,
      };
    }),
  setClockZone: (clockZone) => set({ clockZone }),
  setClockOpen: (clockOpen) =>
    set((s) => ({
      clockOpen:
        typeof clockOpen === "function" ? clockOpen(s.clockOpen) : clockOpen,
    })),
  setClockMs: (clockMs) => set({ clockMs }),
  setViewerPin: (viewerPin) => set({ viewerPin, placingPin: false }),
  setPlacingPin: (placingPin) => set({ placingPin }),
  focusCountry: (key) =>
    set((s) => ({
      selectedKey: key,
      searchQuery: "",
      focusToken: s.focusToken + 1,
    })),
}));
