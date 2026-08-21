import { Moon, Sun } from "lucide-react";
import {
  CENTRAL_TZ,
  formatClock,
  formatZoneAbbrev,
  formatZoneLabel,
  viewerTimeZone,
  type SkyState,
} from "@/lib/astro";
import { colatitudeGeoMiles, formatGeoMiles, formatLonLat } from "@/lib/distance";
import { useAtlas } from "@/lib/atlas-store";
import { cn } from "@/lib/utils";

type Props = {
  sky: SkyState | null;
  now: Date | null;
};

export function CelestialHud({ sky, now }: Props) {
  const clockZone = useAtlas((s) => s.clockZone);
  const setClockZone = useAtlas((s) => s.setClockZone);
  const localTz = viewerTimeZone();
  const timeZone = clockZone === "central" ? CENTRAL_TZ : localTz;
  const showToggle = localTz !== CENTRAL_TZ;

  return (
    <div className="pointer-events-none absolute top-16 left-3 z-10 w-[min(calc(100%-1.5rem),16.5rem)] sm:top-4 sm:right-4 sm:left-auto">
      <div className="pointer-events-auto rounded-lg border border-border bg-surface/90 px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-mono text-sm tabular-nums text-foreground">
            {now ? formatClock(now, timeZone) : "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {now ? formatZoneAbbrev(now, timeZone) : ""}
          </p>
        </div>
        {showToggle && (
          <div
            role="radiogroup"
            aria-label="Clock timezone"
            className="mt-2 flex w-fit gap-0.5 rounded-full border border-border bg-background/60 p-0.5"
          >
            <ZoneButton
              label={formatZoneLabel(localTz)}
              pressed={clockZone === "local"}
              onClick={() => setClockZone("local")}
            />
            <ZoneButton
              label="Central"
              pressed={clockZone === "central"}
              onClick={() => setClockZone("central")}
            />
          </div>
        )}
        {sky && (
          <dl className="mt-2 space-y-1.5">
            <SkyRow
              icon={Sun}
              name="Sun"
              place={formatLonLat(sky.sun.lon, sky.sun.lat)}
              note={`${formatGeoMiles(colatitudeGeoMiles(sky.sun.lat))} from the pole`}
            />
            <SkyRow
              icon={Moon}
              name="Moon"
              place={formatLonLat(sky.moon.lon, sky.moon.lat)}
              note={sky.phaseName}
            />
          </dl>
        )}
        <p className="mt-2 text-xs leading-snug text-muted-foreground">
          33 statute mi across · 3,000 statute mi up
        </p>
      </div>
    </div>
  );
}

function ZoneButton({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={pressed}
      onClick={onClick}
      className={cn(
        "h-8 rounded-full px-2.5 text-xs font-medium transition-[background-color,color] duration-150 ease-smooth-out sm:h-7",
        pressed
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function SkyRow({
  icon: Icon,
  name,
  place,
  note,
}: {
  icon: typeof Sun;
  name: string;
  place: string;
  note: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-xs text-muted-foreground">{name}</dt>
          <dd className="font-mono text-xs tabular-nums text-foreground">
            {place}
          </dd>
        </div>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
    </div>
  );
}
