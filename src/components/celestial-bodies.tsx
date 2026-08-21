import type { GeoProjection } from "d3-geo";
import { MAP_SIZE } from "@/lib/geo";
import { type SkyState } from "@/lib/astro";
import { formatLonLat } from "@/lib/distance";

type Props = {
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
}: Props) {
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
      {moon && (
        <g transform={`rotate(${moonAngle} ${moon[0]} ${moon[1]})`}>
          <circle cx={moon[0]} cy={moon[1]} r={12} className="map-moon-dark" />
          <path
            d={litMoonPath(moon[0], moon[1], 12, sky.illumination)}
            className="map-moon-lit"
          />
          <circle
            cx={moon[0]}
            cy={moon[1]}
            r={12}
            className="map-moon-edge"
          />
        </g>
      )}
      {moon && (
        <text
          x={moon[0]}
          y={moon[1] - 16}
          className="map-moon-caption"
          textAnchor="middle"
        >
          Moon
        </text>
      )}
      {sun && (
        <g>
          <circle cx={sun[0]} cy={sun[1]} r={34} className="map-sun-glow" />
          <circle cx={sun[0]} cy={sun[1]} r={18} className="map-sun-halo" />
          <circle cx={sun[0]} cy={sun[1]} r={10} className="map-sun" />
          <text
            x={sun[0]}
            y={sun[1] - 22}
            className="map-sun-caption"
            textAnchor="middle"
          >
            Sun
          </text>
        </g>
      )}
      <title>
        {`Sun ${formatLonLat(sky.sun.lon, sky.sun.lat)}; Moon ${formatLonLat(sky.moon.lon, sky.moon.lat)} · ${sky.phaseName}`}
      </title>
    </g>
  );
}

function litMoonPath(cx: number, cy: number, r: number, k: number) {
  const illumination = Math.max(0, Math.min(1, k));
  if (illumination <= 0.02) return "";
  if (illumination >= 0.98) {
    return `M ${cx - r} ${cy} a ${r} ${r} 0 1 1 ${r * 2} 0 a ${r} ${r} 0 1 1 ${-r * 2} 0`;
  }
  const c = 2 * illumination - 1;
  const rx = Math.max(0.35, Math.abs(c) * r);
  const termSweep = c >= 0 ? 1 : 0;
  return [
    `M ${cx} ${cy - r}`,
    `A ${r} ${r} 0 0 1 ${cx} ${cy + r}`,
    `A ${rx} ${r} 0 0 ${termSweep} ${cx} ${cy - r}`,
    "Z",
  ].join(" ");
}
