export const METRIC_IDS = [
  "hdi",
  "lifeExpectancy",
  "gdpPerCapita",
  "population",
  "gdpPpp",
  "co2PerCapita",
  "density",
  "area",
] as const;

export type MetricId = (typeof METRIC_IDS)[number];

export type MetricDef = {
  id: MetricId;
  label: string;
  shortLabel: string;
  unit: string;
  description: string;
  scale: "linear" | "log";
  higherIsBetter: boolean | null;
};

export const METRICS: Record<MetricId, MetricDef> = {
  hdi: {
    id: "hdi",
    label: "Human Development Index",
    shortLabel: "HDI",
    unit: "0–1",
    description: "Composite of life expectancy, education, and income.",
    scale: "linear",
    higherIsBetter: true,
  },
  lifeExpectancy: {
    id: "lifeExpectancy",
    label: "Life expectancy",
    shortLabel: "Life",
    unit: "years",
    description: "Expected years of life at birth.",
    scale: "linear",
    higherIsBetter: true,
  },
  gdpPerCapita: {
    id: "gdpPerCapita",
    label: "GDP per capita",
    shortLabel: "GDP / capita",
    unit: "USD",
    description: "Purchasing-power GDP divided by population.",
    scale: "log",
    higherIsBetter: true,
  },
  population: {
    id: "population",
    label: "Population",
    shortLabel: "Population",
    unit: "people",
    description: "Estimated resident population.",
    scale: "log",
    higherIsBetter: null,
  },
  gdpPpp: {
    id: "gdpPpp",
    label: "GDP (PPP)",
    shortLabel: "GDP",
    unit: "intl. $ bn",
    description: "Total output in billions of international dollars.",
    scale: "log",
    higherIsBetter: null,
  },
  co2PerCapita: {
    id: "co2PerCapita",
    label: "CO₂ per capita",
    shortLabel: "CO₂",
    unit: "t / person",
    description: "Annual carbon dioxide emissions per person.",
    scale: "log",
    higherIsBetter: false,
  },
  density: {
    id: "density",
    label: "Population density",
    shortLabel: "Density",
    unit: "/ km²",
    description: "People per square kilometre of land.",
    scale: "log",
    higherIsBetter: null,
  },
  area: {
    id: "area",
    label: "Land area",
    shortLabel: "Area",
    unit: "km²",
    description: "Total land area.",
    scale: "log",
    higherIsBetter: null,
  },
};

export const CHOROPLETH_STOPS = [
  "#17343c",
  "#1f5c64",
  "#3d8f88",
  "#8bbf9e",
  "#d4d0b0",
  "#efe8d6",
] as const;

export function formatMetric(id: MetricId, value: number): string {
  switch (id) {
    case "population":
      if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
      if (value >= 1e6) return `${(value / 1e6).toFixed(value >= 1e8 ? 0 : 1)}M`;
      if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
      return Math.round(value).toLocaleString();
    case "gdpPpp":
      if (value >= 1000) return `$${(value / 1000).toFixed(2)}T`;
      if (value >= 100) return `$${value.toFixed(0)}B`;
      if (value >= 10) return `$${value.toFixed(1)}B`;
      return `$${value.toFixed(2)}B`;
    case "gdpPerCapita":
      return `$${Math.round(value).toLocaleString()}`;
    case "lifeExpectancy":
      return `${value.toFixed(1)} yrs`;
    case "hdi":
      return value.toFixed(3);
    case "co2PerCapita":
      return `${value < 1 ? value.toFixed(2) : value.toFixed(1)} t`;
    case "density":
      if (value < 1) return `${value.toFixed(2)}/km²`;
      return `${Math.round(value).toLocaleString()}/km²`;
    case "area":
      return `${Math.round(value).toLocaleString()} km²`;
  }
}

export function formatCompactNumber(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toFixed(value < 10 ? 1 : 0);
}
