import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Info, Link2, MapPin, Moon, Sun } from "lucide-react";
import {
  CENTRAL_TZ,
  dayOfYear,
  daysInYear,
  formatClock,
  formatClockDate,
  formatZoneAbbrev,
  formatZoneLabel,
  seasonMarks,
  setZonedDayOfYear,
  setZonedMinutes,
  viewerTimeZone,
  zonedParts,
} from "@/lib/astro";
import {
  colatitudeGeoMiles,
  discDistanceGeo,
  eclipseKind,
  formatCount,
  formatGeoMiles,
  formatLonLat,
  lampBand,
  slantStatuteMiles,
} from "@/lib/distance";
import { useAtlas } from "@/lib/atlas-store";
import { useSkyNow } from "@/lib/use-sky-clock";
import { toShareHash } from "@/lib/share";
import { cn } from "@/lib/utils";

export function CelestialHud() {
  const { now, sky, isLive } = useSkyNow();
  const clockZone = useAtlas((s) => s.clockZone);
  const setClockZone = useAtlas((s) => s.setClockZone);
  const setClockMs = useAtlas((s) => s.setClockMs);
  const clockRate = useAtlas((s) => s.clockRate);
  const setClockRate = useAtlas((s) => s.setClockRate);
  const open = useAtlas((s) => s.clockOpen);
  const setOpen = useAtlas((s) => s.setClockOpen);
  const pin = useAtlas((s) => s.viewerPin);
  const bodyScale = useAtlas((s) => s.bodyScale);
  const setBodyScale = useAtlas((s) => s.setBodyScale);
  const [copied, setCopied] = useState(false);
  const localTz = viewerTimeZone();
  const timeZone = clockZone === "central" ? CENTRAL_TZ : localTz;
  const showToggle = localTz !== CENTRAL_TZ;
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

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

  const parts = now ? zonedParts(now, timeZone) : null;
  const minuteOfDay = parts ? parts.hour * 60 + parts.minute : 0;
  const doy = now ? dayOfYear(now, timeZone) : 0;
  const yearLen = parts ? daysInYear(parts.year) : 365;
  const seasons = parts ? seasonMarks(parts.year, timeZone) : [];

  const eclipse = sky ? eclipseKind(sky.sun, sky.moon) : null;

  const you = useMemo(() => {
    if (!pin || !sky) return null;
    const ground = discDistanceGeo(pin, sky.sun);
    return {
      place: formatLonLat(pin.lon, pin.lat),
      band: lampBand(ground),
      ground,
      slant: slantStatuteMiles(ground),
    };
  }, [pin, sky]);

  function scrub(next: Date) {
    setClockMs(next.getTime());
  }

  function copyLink() {
    if (!now) return;
    const url = new URL(window.location.href);
    const hash = toShareHash({
      t: now.getTime(),
      v: useAtlas.getState().viewMode,
      c: useAtlas.getState().selectedKey,
      pin: pin,
      m: useAtlas.getState().metric,
      s: bodyScale,
      z: clockZone,
    });
    url.hash = hash.startsWith("#") ? hash.slice(1) : hash;
    void navigator.clipboard?.writeText(url.toString()).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      },
      () => {},
    );
  }

  return (
    <div ref={rootRef} className="relative mt-1">
      <button
        type="button"
        aria-label={open ? "Hide time and sky controls" : "Adjust time, sun and moon"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-md py-0.5 pl-0.5 pr-0 text-left transition-[background-color,color] duration-150 ease-smooth-out",
          open ? "text-foreground" : "hover:bg-surface-2/60",
        )}
      >
        {!open && (
          <span className="shrink-0 text-xs text-muted-foreground">
            <span aria-hidden="true" className="mr-1 text-foreground/70">
              →
            </span>
            {clockRate === 0
              ? "Paused"
              : clockRate > 1
                ? `${clockRate}×`
                : "Click to adjust"}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-right font-mono text-xs tabular-nums text-muted-foreground">
          {now ? (
            <>
              {!isLive && (
                <span className="mr-1.5 text-foreground">
                  {formatClockDate(now, timeZone)}
                </span>
              )}
              <span className="text-foreground">
                {formatClock(now, timeZone, clockRate <= 1)}
              </span>
              <span className="ml-1.5">{formatZoneAbbrev(now, timeZone)}</span>
            </>
          ) : (
            "—"
          )}
        </span>
        <span
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground",
            open && "bg-surface-2 text-foreground",
          )}
        >
          <Info className="size-3.5" />
        </span>
      </button>
      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Sun and moon"
          className="absolute top-[calc(100%+6px)] right-0 left-0 z-30 max-h-[min(52dvh,22rem)] overflow-y-auto rounded-lg border border-border bg-surface px-3 py-2.5 shadow-sm"
        >
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-mono text-sm tabular-nums text-foreground">
              {now ? formatClock(now, timeZone, clockRate <= 1) : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {now ? (
                <>
                  {formatClockDate(now, timeZone)}{" "}
                  {formatZoneAbbrev(now, timeZone)}
                </>
              ) : (
                ""
              )}
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
          {now && (
            <div className="mt-2 space-y-2">
              <label className="block">
                <span className="text-xs text-muted-foreground">Hour</span>
                <input
                  type="range"
                  min={0}
                  max={1439}
                  step={1}
                  value={minuteOfDay}
                  aria-label="Hour of day"
                  className="time-slider mt-1"
                  onChange={(e) =>
                    scrub(setZonedMinutes(now, timeZone, Number(e.target.value)))
                  }
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground">Day of year</span>
                <input
                  type="range"
                  min={0}
                  max={yearLen - 1}
                  step={1}
                  value={doy}
                  aria-label="Day of year"
                  className="time-slider mt-1"
                  onChange={(e) =>
                    scrub(
                      setZonedDayOfYear(now, timeZone, Number(e.target.value)),
                    )
                  }
                />
              </label>
              <div className="flex flex-wrap gap-0.5">
                <ZoneButton
                  label="Now"
                  pressed={isLive && clockRate === 1}
                  onClick={() => {
                    setClockRate(1);
                    setClockMs(null);
                  }}
                />
                <ZoneButton
                  label="Pause"
                  pressed={clockRate === 0}
                  onClick={() => setClockRate(0)}
                />
                <ZoneButton
                  label="10×"
                  pressed={clockRate === 10}
                  onClick={() => setClockRate(10)}
                />
                <ZoneButton
                  label="20×"
                  pressed={clockRate === 20}
                  onClick={() => setClockRate(20)}
                />
                {seasons.map((mark) => (
                  <ZoneButton
                    key={mark.id}
                    label={mark.short}
                    pressed={
                      !isLive &&
                      formatClockDate(now, timeZone) ===
                        formatClockDate(mark.date, timeZone)
                    }
                    onClick={() => scrub(mark.date)}
                  />
                ))}
              </div>
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
                note={
                  eclipse
                    ? `${sky.phaseName} · ${eclipse === "total" ? "Total eclipse" : "Partial eclipse"}`
                    : sky.phaseName
                }
              />
              {you && (
                <SkyRow
                  icon={MapPin}
                  name="You"
                  place={you.place}
                  note={`${you.band} · ${formatGeoMiles(you.ground)} to the sun`}
                  spec={`${formatCount(you.slant)} statute mi slant`}
                />
              )}
            </dl>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <p className="text-xs text-muted-foreground">
              33 statute mi across · 3,000 statute mi up
            </p>
            <ZoneButton
              label={bodyScale === 10 ? "Readable" : "True"}
              pressed={bodyScale === 10}
              onClick={() => setBodyScale(bodyScale === 10 ? 1 : 10)}
            />
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-muted-foreground transition-[background-color,color] duration-150 hover:bg-surface-2 hover:text-foreground sm:h-7"
            >
              <Link2 className="size-3" />
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
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
