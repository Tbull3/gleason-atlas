import { METRICS, formatMetric, type MetricId } from "@/data/metrics";
import type { ColorScale } from "@/lib/color-scale";
import { scalePosition } from "@/lib/color-scale";
import { useAtlas } from "@/lib/atlas-store";
import { COUNTRY_BY_KEY, metricValue } from "@/data/countries";

type Props = {
  scale: ColorScale;
  metric: MetricId;
};

export function MapLegend({ scale, metric }: Props) {
  const def = METRICS[metric];
  const selectedKey = useAtlas((s) => s.selectedKey);
  const hoveredKey = useAtlas((s) => s.hoveredKey);
  const markerKey = hoveredKey ?? selectedKey;
  const marker = markerKey
    ? metricValue(COUNTRY_BY_KEY.get(markerKey), metric)
    : null;
  const t = scalePosition(marker, scale.min, scale.max, def.scale === "log");

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-10 w-48 rounded-lg border border-border bg-surface/90 p-3 sm:bottom-6 sm:left-6">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {def.shortLabel}
        </div>
        {def.scale === "log" && (
          <div className="text-xs text-muted-foreground">log</div>
        )}
      </div>
      <div
        className="relative mt-2 h-2 w-full rounded-full"
        style={{ backgroundImage: "var(--choropleth-ramp)" }}
      >
        {t != null && (
          <span
            className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground ring-2 ring-surface"
            style={{ left: `${Math.min(100, Math.max(0, t * 100))}%` }}
          />
        )}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-xs tabular-nums text-muted-foreground">
        <span>{formatMetric(metric, scale.min)}</span>
        <span>{formatMetric(metric, scale.max)}</span>
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-nodata" />
          No data
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-ice" />
          Ice
        </span>
      </div>
    </div>
  );
}
