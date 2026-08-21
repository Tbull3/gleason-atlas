import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  STATUTE_PER_GEO,
  formatCount,
  formatGeoMiles,
  formatKm,
  formatLonLat,
  formatStatuteMiles,
  type MeasurePoint,
  discMeasure,
} from "@/lib/distance";

type Props = {
  a: MeasurePoint | null;
  b: MeasurePoint | null;
  onClear: () => void;
};

export function DistanceHud({ a, b, onClear }: Props) {
  const result = a && b ? discMeasure(a, b) : null;

  return (
    <div className="pointer-events-none absolute bottom-4 left-3 z-10 w-[min(calc(100%-4.5rem),19rem)] sm:bottom-6 sm:left-6">
      <div className="pointer-events-auto rounded-lg border border-border bg-surface/90 px-3 py-2.5">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Gleason scale · 1892
        </p>
        <ScaleBar />
        {!a && (
          <p className="mt-2 text-xs leading-snug text-muted-foreground">
            Click two points. Geographical miles (1′ of arc) are true from
            the pole along a meridian.
          </p>
        )}
        {a && !b && (
          <p className="mt-2 text-xs leading-snug text-muted-foreground">
            From the pole {formatGeoMiles(resultPlaceholder(a))} · click a
            second point.
          </p>
        )}
        {a && b && result && (
          <div className="mt-2 flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm font-medium tabular-nums text-foreground">
                {formatCount(result.geo)} geo. mi
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatStatuteMiles(result.geo)} · {formatKm(result.geo)}
              </p>
              <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
                {formatLonLat(a.lon, a.lat)} → {formatLonLat(b.lon, b.lat)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                From pole {formatCount(result.fromPoleA)} and{" "}
                {formatCount(result.fromPoleB)} geo. mi
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Clear measurement"
              onClick={onClear}
              className="shrink-0 text-muted-foreground"
            >
              <X />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function resultPlaceholder(a: MeasurePoint) {
  return (90 - a.lat) * 60;
}

function ScaleBar() {
  return (
    <div className="mt-1.5">
      <div className="flex h-2 overflow-hidden rounded-sm border border-border">
        <span className="w-1/4 bg-foreground/25" />
        <span className="w-1/4 bg-transparent" />
        <span className="w-1/4 bg-foreground/25" />
        <span className="w-1/4 bg-transparent" />
      </div>
      <div className="mt-1 flex justify-between font-mono text-xs tabular-nums text-muted-foreground">
        <span>0</span>
        <span>500</span>
        <span>1,000 geo. mi</span>
      </div>
      <div className="flex justify-between font-mono text-xs tabular-nums text-muted-foreground">
        <span>0</span>
        <span>{formatCount(500 * STATUTE_PER_GEO)}</span>
        <span>{formatCount(1000 * STATUTE_PER_GEO)} statute mi</span>
      </div>
    </div>
  );
}
