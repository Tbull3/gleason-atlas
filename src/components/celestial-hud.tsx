import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Info, Moon, Sun } from "lucide-react";
import {
  CENTRAL_TZ,
  formatClock,
  formatZoneAbbrev,
  formatZoneLabel,
  skyAt,
  viewerTimeZone,
} from "@/lib/astro";
import { colatitudeGeoMiles, formatGeoMiles, formatLonLat } from "@/lib/distance";
import { useAtlas } from "@/lib/atlas-store";
import { cn } from "@/lib/utils";

export function CelestialHud() {
  const [now, setNow] = useState<Date | null>(null);
  const clockZone = useAtlas((s) => s.clockZone);
  const setClockZone = useAtlas((s) => s.setClockZone);
  const open = useAtlas((s) => s.clockOpen);
  const setOpen = useAtlas((s) => s.setClockOpen);
  const localTz = viewerTimeZone();
  const timeZone = clockZone === "central" ? CENTRAL_TZ : localTz;
  const showToggle = localTz !== CENTRAL_TZ;
  const sky = useMemo(() => (now ? skyAt(now) : null), [now]);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return (
    <div ref={rootRef} className="relative mt-1">
      <div className="flex items-center gap-1 pl-0.5">
        <p className="min-w-0 flex-1 truncate font-mono text-xs tabular-nums text-muted-foreground">
          {now ? (
            <>
              <span className="text-foreground">{formatClock(now, timeZone)}</span>
              <span className="ml-1.5">{formatZoneAbbrev(now, timeZone)}</span>
            </>
          ) : (
            "—"
          )}
        </p>
        <button
          type="button"
          aria-label={open ? "Hide sun and moon details" : "Sun and moon details"}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color] duration-150 ease-smooth-out",
            open
              ? "bg-surface-2 text-foreground"
              : "hover:bg-surface-2 hover:text-foreground",
          )}
        >
          <Info className="size-3.5" />
        </button>
      </div>
      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Sun and moon"
          className="absolute top-[calc(100%+6px)] right-0 left-0 z-30 rounded-lg border border-border bg-surface px-3 py-2.5 shadow-sm"
        >
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
                spec="33 statute mi across · 3,000 statute mi up"
              />
              <SkyRow
                icon={Moon}
                name="Moon"
                place={formatLonLat(sky.moon.lon, sky.moon.lat)}
                note={sky.phaseName}
                spec="33 statute mi across · 3,000 statute mi up"
              />
            </dl>
          )}
        </div>
      )}
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
  spec,
}: {
  icon: typeof Sun;
  name: string;
  place: string;
  note: string;
  spec?: string;
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
        {spec && <p className="text-xs text-muted-foreground">{spec}</p>}
      </div>
    </div>
  );
}
