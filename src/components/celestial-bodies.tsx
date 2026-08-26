import { useId, type CSSProperties } from "react";
import type { GeoProjection } from "d3-geo";
import { MAP_RADIUS, MAP_SIZE } from "@/lib/geo";
import { type SkyState } from "@/lib/astro";
import {
  BODY_ALTITUDE_GEO,
  BODY_RADIUS_SVG,
  SVG_PER_GEO_MILE,
  formatLonLat,
  type EclipseKind,
} from "@/lib/distance";

type MarkProps = {
  projection: GeoProjection;
  sky: SkyState;
  zoneMeridian: number;
  zoneAbbrev: string;
  bodyScale: 1 | 10;
  eclipse: EclipseKind;
};

export function CelestialBodies({
  projection,
  sky,
  zoneMeridian,
  zoneAbbrev,
  bodyScale,
  eclipse,
}: MarkProps) {
  const uid = useId().replace(/:/g, "");
  const cx = MAP_SIZE / 2;
  const cy = MAP_SIZE / 2;
  const pole = projection([0, 90]) ?? [cx, cy];
  const sun = projection([sky.sun.lon, sky.sun.lat]);
  const moon = projection([sky.moon.lon, sky.moon.lat]);
  const sunRim = projection([sky.sun.lon, -89.2]);
  const zoneRim = projection([zoneMeridian, -89.2]);
  const sunNoon = projection([sky.sun.lon, -84]);
  const zoneLabel = projection([zoneMeridian, -84]);
  const nadirR = Math.max(0.6, BODY_RADIUS_SVG * bodyScale);
  const moonAngle =
    sun && moon
      ? (Math.atan2(sun[1] - moon[1], sun[0] - moon[0]) * 180) / Math.PI
      : 0;
  const altitudeSvg = BODY_ALTITUDE_GEO * SVG_PER_GEO_MILE;
  const lightRadius = altitudeSvg * 3.2;

  return (
    <g className="celestial-layer" pointerEvents="none">
      {sun && (
        <Sunlight
          uid={uid}
          cx={cx}
          cy={cy}
          sun={sun}
          altitudeSvg={altitudeSvg}
          lightRadius={lightRadius}
        />
      )}
      {sunRim && (
        <line
          x1={pole[0]}
          y1={pole[1]}
          x2={sunRim[0]}
          y2={sunRim[1]}
          className="map-sun-arm"
        />
      )}
      {zoneRim && (
        <line
          x1={pole[0]}
          y1={pole[1]}
          x2={zoneRim[0]}
          y2={zoneRim[1]}
          className="map-civil-arm"
        />
      )}
      {zoneLabel && (
        <text
          x={zoneLabel[0]}
          y={zoneLabel[1]}
          className="map-civil-label"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {zoneAbbrev}
        </text>
      )}
      {sunNoon && (
        <text
          x={sunNoon[0]}
          y={sunNoon[1]}
          className="map-sun-label"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          Noon
        </text>
      )}
      {sun && (
        <circle
          cx={sun[0]}
          cy={sun[1]}
          r={nadirR}
          className="map-sun-nadir"
        />
      )}
      {moon && (
        <g transform={`rotate(${moonAngle} ${moon[0]} ${moon[1]})`}>
          <circle
            cx={moon[0]}
            cy={moon[1]}
            r={nadirR}
            className="map-moon-nadir"
          />
        </g>
      )}
      {eclipse && sun && (
        <text
          x={sun[0]}
          y={sun[1] + 14}
          className="map-eclipse-label"
          textAnchor="middle"
        >
          {eclipse === "total" ? "Eclipse" : "Partial eclipse"}
        </text>
      )}
      <title>
        {`Sun ${formatLonLat(sky.sun.lon, sky.sun.lat)}; Moon ${formatLonLat(sky.moon.lon, sky.moon.lat)} · ${sky.phaseName} · 33 statute mi across, 3,000 statute mi up`}
      </title>
    </g>
  );
}

function Sunlight({
  uid,
  cx,
  cy,
  sun,
  altitudeSvg,
  lightRadius,
}: {
  uid: string;
  cx: number;
  cy: number;
  sun: [number, number];
  altitudeSvg: number;
  lightRadius: number;
}) {
  const night = `sun-night-${uid}`;
  const day = `sun-day-${uid}`;
  const clip = `sun-clip-${uid}`;
  return (
    <>
      <defs>
        <clipPath id={clip}>
          <circle cx={cx} cy={cy} r={MAP_RADIUS} />
        </clipPath>
        <radialGradient
          id={day}
          gradientUnits="userSpaceOnUse"
          cx={sun[0]}
          cy={sun[1]}
          r={altitudeSvg * 1.15}
        >
          <stop
            offset="0%"
            stopColor="var(--color-sun)"
            stopOpacity="0.22"
          />
          <stop
            offset="45%"
            stopColor="var(--color-sun)"
            stopOpacity="0.08"
          />
          <stop
            offset="100%"
            stopColor="var(--color-sun)"
            stopOpacity="0"
          />
        </radialGradient>
        <radialGradient
          id={night}
          gradientUnits="userSpaceOnUse"
          cx={sun[0]}
          cy={sun[1]}
          r={lightRadius}
        >
          <stop offset="0%" stopColor="var(--color-background)" stopOpacity="0" />
          <stop
            offset="28%"
            stopColor="var(--color-background)"
            stopOpacity="0.06"
          />
          <stop
            offset="48%"
            stopColor="var(--color-background)"
            stopOpacity="0.32"
          />
          <stop
            offset="72%"
            stopColor="var(--color-background)"
            stopOpacity="0.62"
          />
          <stop
            offset="100%"
            stopColor="var(--color-background)"
            stopOpacity="0.82"
          />
        </radialGradient>
      </defs>
      <circle
        cx={cx}
        cy={cy}
        r={MAP_RADIUS}
        fill={`url(#${day})`}
        clipPath={`url(#${clip})`}
      />
      <circle
        cx={cx}
        cy={cy}
        r={MAP_RADIUS}
        fill={`url(#${night})`}
        clipPath={`url(#${clip})`}
      />
    </>
  );
}

type OrbProps = {
  projection: GeoProjection;
  sky: SkyState;
};

export function CelestialOrbs({ projection, sky }: OrbProps) {
  const sun = projection([sky.sun.lon, sky.sun.lat]);
  const moon = projection([sky.moon.lon, sky.moon.lat]);
  const moonAngle =
    sun && moon
      ? (Math.atan2(sun[1] - moon[1], sun[0] - moon[0]) * 180) / Math.PI
      : 0;

  return (
    <>
      {sun && (
        <CelestialPost
          x={sun[0]}
          y={sun[1]}
          kind="sun"
          label="Sun"
        />
      )}
      {moon && (
        <CelestialPost
          x={moon[0]}
          y={moon[1]}
          kind="moon"
          label="Moon"
          illumination={sky.illumination}
          litAngle={moonAngle}
        />
      )}
    </>
  );
}

function CelestialPost({
  x,
  y,
  kind,
  label,
  illumination = 1,
  litAngle = 0,
}: {
  x: number;
  y: number;
  kind: "sun" | "moon";
  label: string;
  illumination?: number;
  litAngle?: number;
}) {
  const lit = Math.round(Math.max(0, Math.min(1, illumination)) * 100);
  return (
    <div
      className={`celestial-post is-${kind}`}
      style={
        {
          left: `${(x / MAP_SIZE) * 100}%`,
          top: `${(y / MAP_SIZE) * 100}%`,
        } as CSSProperties
      }
    >
      {kind === "sun" && <span className="celestial-cone" />}
      <span className="celestial-stem" />
      <span className="celestial-lift">
        <span
          className={`celestial-orb is-${kind}`}
          style={
            kind === "moon"
              ? {
                  backgroundImage: `radial-gradient(circle at 32% 28%, color-mix(in oklab, white 38%, transparent) 0%, transparent 42%), linear-gradient(${litAngle + 90}deg, var(--color-moon-shadow) ${100 - lit}%, var(--color-moon) ${100 - lit}%)`,
                }
              : undefined
          }
          aria-label={label}
        />
      </span>
    </div>
  );
}
