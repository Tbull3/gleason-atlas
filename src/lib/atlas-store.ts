import { create } from "zustand";
import type { MetricId } from "@/data/metrics";

function wrapLon(lon: number) {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

type AtlasState = {
  metric: MetricId;
  selectedKey: string | null;
  hoveredKey: string | null;
  rotation: number;
  searchQuery: string;
  focusToken: number;
  setMetric: (metric: MetricId) => void;
  setSelectedKey: (selectedKey: string | null) => void;
  setHoveredKey: (hoveredKey: string | null) => void;
  setRotation: (rotation: number | ((current: number) => number)) => void;
  setSearchQuery: (searchQuery: string) => void;
  focusCountry: (key: string) => void;
};

export const useAtlas = create<AtlasState>((set) => ({
  metric: "hdi",
  selectedKey: null,
  hoveredKey: null,
  rotation: -20,
  searchQuery: "",
  focusToken: 0,
  setMetric: (metric) => set({ metric }),
  setSelectedKey: (selectedKey) => set({ selectedKey }),
  setHoveredKey: (hoveredKey) => set({ hoveredKey }),
  setRotation: (rotation) =>
    set((s) => ({
      rotation: wrapLon(
        typeof rotation === "function" ? rotation(s.rotation) : rotation,
      ),
    })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  focusCountry: (key) =>
    set((s) => ({
      selectedKey: key,
      searchQuery: "",
      focusToken: s.focusToken + 1,
    })),
}));
