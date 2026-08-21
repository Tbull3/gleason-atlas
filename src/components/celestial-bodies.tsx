import type { CSSProperties } from "react";
import type { GeoProjection } from "d3-geo";
import { MAP_SIZE } from "@/lib/geo";
import { type SkyState } from "@/lib/astro";
import { BODY_RADIUS_SVG, formatLonLat } from "@/lib/distance";

type MarkProps = {
  projection: GeoProjection;
  sky: SkyState;
  zoneMeridian: number;
  zoneAbbrev: string;
};

export function CelestialBodies({
  projection,
  sky,
  zoneMeridian,
  zoneAbbrev,
}: MarkProps) {
  const cx = MAP_SIZE / 2;
  const cy = MAP_SIZE / 2;
  const pole = projection([0, 90]) ?? [cx, cy];
  const sun = projection([sky.sun.lon, sky.sun.lat]);
  const moon = projection([sky.moon.lon, sky.moon.lat]);
  const sunRim = projection([sky.sun.lon, -89.2]);
  const zoneRim = projection([zoneMeridian, -89.2]);
  const sunNoon = projection([sky.sun.lon, -84]);
  const zoneLabel = projection([zoneMeridian, -84]);
  const moonAngle =
    sun && moon
      ? (Math.atan2(sun[1] - moon[1], sun[0] - moon[0]) * 180) / Math.PI
      : 0;

  return (
    <g className="celestial-layer" pointerEvents="none">
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
          r={BODY_RADIUS_SVG}
          className="map-sun-nadir"
        />
      )}
      {moon && (
        <g transform={`rotate(${moonAngle} ${moon[0]} ${moon[1]})`}>
          <circle
            cx={moon[0]}
            cy={moon[1]}
            r={BODY_RADIUS_SVG}
            className="map-moon-nadir"
          />
        </g>
      )}
      <title>
        {`Sun ${formatLonLat(sky.sun.lon, sky.sun.lat)}; Moon ${formatLonLat(sky.moon.lon, sky.moon.lat)} · ${sky.phaseName} · 33 mi across, 3,000 mi up`}
      </title>
    </g>
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
          ["--lit-angle"]: `${litAngle}deg`,
        } as CSSProperties
      }
    >
      <span className="celestial-stem" />
      <span
        className={`celestial-orb is-${kind}`}
        style={
          kind === "moon"
            ? {
                backgroundImage: `linear-gradient(90deg, var(--color-moon-shadow) ${100 - lit}%, var(--color-moon) ${100 - lit}%)`,
              }
            : undefined
        }
        aria-label={label}
      />
    </div>
  );
}
