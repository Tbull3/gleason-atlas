import { useEffect, useMemo, useState } from "react";
import type { GeoProjection } from "d3-geo";
import { geoPath } from "d3-geo";
import { MAP_RADIUS, MAP_SIZE } from "@/lib/geo";
import { hourMeridian } from "@/lib/astro";
import { TROPIC_LAT } from "@/lib/distance";

type Props = {
  projection: GeoProjection;
};

const HOUR_LABELS = [0, 3, 6, 9, 12, 15, 18, 21];

function parallel(lat: number) {
  const coordinates: [number, number][] = [];
  for (let lon = -180; lon <= 180; lon += 2) {
    coordinates.push([lon, lat]);
  }
  return { type: "LineString" as const, coordinates };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export function TimeRing({ projection }: Props) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const cx = MAP_SIZE / 2;
  const cy = MAP_SIZE / 2;
  const path = useMemo(() => geoPath(projection), [projection]);
  const cancer = useMemo(() => path(parallel(TROPIC_LAT)) ?? "", [path]);
  const capricorn = useMemo(
    () => path(parallel(-TROPIC_LAT)) ?? "",
    [path],
  );
  const june = projection([-28, TROPIC_LAT]);
  const december = projection([-28, -TROPIC_LAT]);
  const junePt = june ? [round(june[0]), round(june[1])] : null;
  const decPt = december ? [round(december[0]), round(december[1])] : null;

  const hours = useMemo(() => {
    return Array.from({ length: 24 }, (_, hour) => {
      const lon = hourMeridian(hour);
      const rim = projection([lon, -88.4]);
      const labelPt = projection([lon, -86.2]);
      if (!rim) return null;
      const dx = rim[0] - cx;
      const dy = rim[1] - cy;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const major = hour % 3 === 0;
      const tick = major ? 10 : 5;
      return {
        hour,
        major,
        x1: round(cx + ux * (MAP_RADIUS - tick)),
        y1: round(cy + uy * (MAP_RADIUS - tick)),
        x2: round(cx + ux * MAP_RADIUS),
        y2: round(cy + uy * MAP_RADIUS),
        lx: round(labelPt ? labelPt[0] : cx + ux * (MAP_RADIUS - 22)),
        ly: round(labelPt ? labelPt[1] : cy + uy * (MAP_RADIUS - 22)),
        label: major ? String(hour).padStart(2, "0") : null,
      };
    }).filter(Boolean) as {
      hour: number;
      major: boolean;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      lx: number;
      ly: number;
      label: string | null;
    }[];
  }, [projection, cx, cy]);

  if (!ready) return null;

  return (
    <g className="time-ring" pointerEvents="none">
      <path d={cancer} className="map-tropic" />
      <path d={capricorn} className="map-tropic" />
      {junePt && (
        <text
          x={junePt[0]}
          y={junePt[1]}
          className="map-tropic-label"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          June
        </text>
      )}
      {decPt && (
        <text
          x={decPt[0]}
          y={decPt[1]}
          className="map-tropic-label"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          December
        </text>
      )}
      {hours.map((h) => (
        <g key={h.hour}>
          <line
            x1={h.x1}
            y1={h.y1}
            x2={h.x2}
            y2={h.y2}
            className={h.major ? "map-hour-tick is-major" : "map-hour-tick"}
          />
          {h.label && HOUR_LABELS.includes(h.hour) && (
            <text
              x={h.lx}
              y={h.ly}
              className="map-hour-label"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {h.label}
            </text>
          )}
        </g>
      ))}
    </g>
  );
}
