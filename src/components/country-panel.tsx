import { X } from "lucide-react";
import { Drawer } from "vaul";
import { METRIC_IDS, METRICS, formatMetric } from "@/data/metrics";
import {
  COUNTRY_BY_KEY,
  countryRank,
  metricValue,
  rankedCountries,
  worldTotal,
} from "@/data/countries";
import { createColorScale, scalePosition } from "@/lib/color-scale";
import { useAtlas } from "@/lib/atlas-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/use-media-query";
import { useMemo } from "react";
import { createGleasonProjection } from "@/lib/geo";
import {
  countryFromPole,
  formatCount,
  formatStatuteMiles,
} from "@/lib/distance";

export function CountryPanel() {
  const isDesktop = useMediaQuery("(min-width: 1024px)", true);
  const selectedKey = useAtlas((s) => s.selectedKey);
  const setSelectedKey = useAtlas((s) => s.setSelectedKey);

  return (
    <>
      <aside className="hidden h-full w-96 shrink-0 overflow-y-auto border-l border-border bg-surface lg:block">
        <PanelBody />
      </aside>
      <Drawer.Root
        open={!isDesktop && Boolean(selectedKey)}
        onOpenChange={(open) => {
          if (!open) setSelectedKey(null);
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-background/50 lg:hidden" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[78dvh] flex-col rounded-t-xl border border-border bg-surface outline-none lg:hidden">
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
            <div className="overflow-y-auto px-1 pb-8">
              <PanelBody />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}

function PanelBody() {
  const selectedKey = useAtlas((s) => s.selectedKey);
  const setSelectedKey = useAtlas((s) => s.setSelectedKey);
  const metric = useAtlas((s) => s.metric);
  const setMetric = useAtlas((s) => s.setMetric);
  const country = selectedKey ? COUNTRY_BY_KEY.get(selectedKey) : undefined;

  if (!country) {
    return <EmptyPanel />;
  }

  const value = metricValue(country, metric);
  const rank = countryRank(country.key, metric);
  const def = METRICS[metric];
  const total = worldTotal(metric);
  const share =
    value != null &&
    (metric === "population" || metric === "gdpPpp" || metric === "area") &&
    total > 0
      ? (value / total) * 100
      : null;

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            {country.region}
            {country.iso3 ? ` · ${country.iso3}` : ""}
          </p>
          <h2 className="font-display mt-1 text-2xl leading-tight font-medium tracking-tight">
            {country.name}
          </h2>
          {country.capital && (
            <p className="mt-1 text-sm text-muted-foreground">
              Capital {country.capital}
            </p>
          )}
          <FromPoleLine countryKey={country.key} />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Clear selection"
          className="hidden lg:inline-flex"
          onClick={() => setSelectedKey(null)}
        >
          <X />
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-surface-2 p-4">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          {def.label}
        </p>
        <p className="mt-1 font-mono text-3xl font-medium tabular-nums">
          {value == null ? "—" : formatMetric(metric, value)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {rank && (
            <Badge variant="outline">
              Rank {rank.rank} of {rank.total}
            </Badge>
          )}
          {share != null && (
            <Badge variant="outline">{share.toFixed(1)}% of world</Badge>
          )}
        </div>
        <ScaleTrack metric={metric} value={value} />
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {def.description}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-3">
        {METRIC_IDS.map((id) => {
          const v = metricValue(country, id);
          const active = id === metric;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setMetric(id)}
              className={cn(
                "rounded-md border px-3 py-2.5 text-left transition-[background-color,border-color] duration-150 ease-smooth-out",
                active
                  ? "border-foreground/30 bg-surface-2"
                  : "border-border hover:bg-surface-2",
              )}
            >
              <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                {METRICS[id].shortLabel}
              </dt>
              <dd className="mt-0.5 font-mono text-sm tabular-nums">
                {v == null ? "—" : formatMetric(id, v)}
              </dd>
            </button>
          );
        })}
      </dl>
    </div>
  );
}

function ScaleTrack({
  metric,
  value,
}: {
  metric: Parameters<typeof createColorScale>[0];
  value: number | null;
}) {
  const scale = createColorScale(metric);
  const log = METRICS[metric].scale === "log";
  const t = scalePosition(value, scale.min, scale.max, log);
  if (t == null) return null;

  return (
    <div className="mt-3">
      <div
        className="relative h-1.5 w-full rounded-full"
        style={{ backgroundImage: "var(--choropleth-ramp)" }}
      >
        <span
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground ring-2 ring-surface-2"
          style={{ left: `${Math.min(100, Math.max(0, t * 100))}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between font-mono text-xs tabular-nums text-muted-foreground">
        <span>{formatMetric(metric, scale.min)}</span>
        <span>{formatMetric(metric, scale.max)}</span>
      </div>
    </div>
  );
}

function EmptyPanel() {
  const metric = useAtlas((s) => s.metric);
  const focusCountry = useAtlas((s) => s.focusCountry);
  const def = METRICS[metric];
  const top = rankedCountries(metric).slice(0, 8);

  return (
    <div className="flex flex-col gap-5 p-5">
      <div>
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Gleason projection
        </p>
        <h2 className="font-display mt-1 text-2xl leading-tight font-medium tracking-tight">
          Polar atlas
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Distances from the North Pole are true. Continents stretch toward the
          Antarctic ice ring at the rim. Hover for a reading, click a country
          for the full sheet, then switch the metric above. The ruler shows
          Gleason’s 1892 geographical-mile scale and the four cardinal meridians
          at the ice.
        </p>
      </div>
      <Separator />
      <div>
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Highest {def.shortLabel}
        </p>
        <ol className="mt-3 space-y-1">
          {top.map((c, i) => {
            const v = metricValue(c, metric);
            return (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={() => focusCountry(c.key)}
                  className="flex w-full items-baseline justify-between gap-3 rounded-md px-2 py-2 text-left transition-colors duration-150 ease-smooth-out hover:bg-surface-2"
                >
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="w-4 font-mono text-xs tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="truncate text-sm">{c.name}</span>
                  </span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {v == null ? "—" : formatMetric(metric, v)}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Figures are illustrative 2024 estimates compiled for comparison, not
        official statistics.
      </p>
    </div>
  );
}

function FromPoleLine({ countryKey }: { countryKey: string }) {
  const fromPole = useMemo(() => {
    const projection = createGleasonProjection(0);
    return countryFromPole(countryKey, projection);
  }, [countryKey]);

  if (!fromPole) return null;

  return (
    <p className="mt-1.5 text-xs text-muted-foreground">
      {formatCount(fromPole.geoMiles)} geo. mi from the pole
      <span className="text-muted-foreground/80">
        {" "}
        · {formatStatuteMiles(fromPole.geoMiles)}
      </span>
    </p>
  );
}
