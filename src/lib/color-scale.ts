import { scaleLinear, scaleLog } from "d3-scale";
import { interpolateRgbBasis } from "d3-interpolate";
import { CHOROPLETH_STOPS, METRICS, type MetricId } from "@/data/metrics";
import { COUNTRIES, metricValue } from "@/data/countries";

const interpolator = interpolateRgbBasis([...CHOROPLETH_STOPS]);

export type ColorScale = {
  color: (value: number | null | undefined) => string;
  ticks: number[];
  min: number;
  max: number;
};

export function scalePosition(
  value: number | null | undefined,
  min: number,
  max: number,
  log: boolean,
): number | null {
  if (value == null || !Number.isFinite(value) || max === min) return null;
  if (log && min > 0 && value > 0) {
    return (Math.log(value) - Math.log(min)) / (Math.log(max) - Math.log(min));
  }
  return (value - min) / (max - min);
}

export function createColorScale(metric: MetricId): ColorScale {
  const def = METRICS[metric];
  const values = COUNTRIES.map((c) => metricValue(c, metric)).filter(
    (v): v is number => v != null && Number.isFinite(v),
  );
  const min = Math.min(...values);
  const max = Math.max(...values);
  const useLog = def.scale === "log" && min > 0;

  const scaler = useLog
    ? scaleLog().domain([min, max]).range([0, 1]).clamp(true)
    : scaleLinear().domain([min, max]).range([0, 1]).clamp(true);

  const rawTicks = useLog
    ? scaleLog().domain([min, max]).ticks(4)
    : scaleLinear().domain([min, max]).ticks(4);

  const ticks = Array.from(new Set([min, ...rawTicks, max])).filter(
    (t) => t >= min && t <= max,
  );

  return {
    min,
    max,
    ticks,
    color: (value) => {
      if (value == null || !Number.isFinite(value)) return "";
      return interpolator(scaler(value));
    },
  };
}
