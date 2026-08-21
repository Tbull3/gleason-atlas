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
    })),
  setTurn: (turn) =>
    set((s) => ({
      turn: wrapDeg(typeof turn === "function" ? turn(s.turn) : turn),
    })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setMeasureMode: (measureMode) =>
    set((s) => ({
      measureMode:
        typeof measureMode === "function"
          ? measureMode(s.measureMode)
          : measureMode,
    })),
  setClockZone: (clockZone) => set({ clockZone }),
  focusCountry: (key) =>
    set((s) => ({
      selectedKey: key,
      searchQuery: "",
      focusToken: s.focusToken + 1,
    })),
}));
