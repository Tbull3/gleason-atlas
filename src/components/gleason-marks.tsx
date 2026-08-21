import { useMemo } from "react";
import type { GeoProjection } from "d3-geo";
import { geoPath } from "d3-geo";
import { MAP_RADIUS, MAP_SIZE } from "@/lib/geo";
import {
  CARDINAL_MERIDIANS,
  MILE_RINGS,
  formatCount,
  ringRadius,
} from "@/lib/distance";

type Props = {
  projection: GeoProjection;
};

export function GleasonMarks({ projection }: Props) {
  const cx = MAP_SIZE / 2;
  const cy = MAP_SIZE / 2;
  const path = useMemo(() => geoPath(projection), [projection]);

  const meridians = useMemo(() => {
    return CARDINAL_MERIDIANS.map((m) => {
      const coordinates: [number, number][] = [];
      for (let lat = 90; lat >= -89.5; lat -= 2) {
        coordinates.push([m.lon, lat]);
      }
      const d =
        path({ type: "LineString", coordinates }) ?? "";
      const rim = projection([m.lon, -89.2]);
      let corner: {
        x: number;
        y: number;
        lx: number;
        ly: number;
        tx1: number;
        ty1: number;
        tx2: number;
        ty2: number;
      } | null = null;
      if (rim) {
        const dx = rim[0] - cx;
        const dy = rim[1] - cy;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const px = -uy;
        const py = ux;
        const r = MAP_RADIUS;
        corner = {
          x: cx + ux * r,
          y: cy + uy * r,
          lx: cx + ux * (r - 30),
          ly: cy + uy * (r - 30),
          tx1: cx + ux * r - px * 12,
          ty1: cy + uy * r - py * 12,
          tx2: cx + ux * r + px * 12,
          ty2: cy + uy * r + py * 12,
        };
      }
      return { ...m, d, corner };
    });
  }, [path, projection, cx, cy]);

  const pole = projection([0, 90]) ?? [cx, cy];
  const mileLabels = useMemo(() => {
    return MILE_RINGS.map((ring) => {
      const p = projection([-28, ring.lat]);
      return {
        ...ring,
        x: p ? p[0] + 5 : cx + 10,
        y: p ? p[1] : cy - ringRadius(ring.geoMiles),
      };
    });
  }, [projection, cx, cy]);

  return (
    <g className="gleason-marks" pointerEvents="none">
      {MILE_RINGS.map((ring) => (
        <circle
          key={ring.geoMiles}
          cx={cx}
          cy={cy}
          r={ringRadius(ring.geoMiles)}
          className="map-mile-ring"
        />
      ))}
      {mileLabels.map((ring) => (
        <text
          key={`label-${ring.geoMiles}`}
          x={ring.x}
          y={ring.y}
          className="map-mile-label"
        >
          {formatCount(ring.geoMiles)} · {ring.caption}
        </text>
      ))}
      {meridians.map((m) => (
        <g key={m.lon}>
          <path d={m.d} className="map-cardinal-meridian" />
          {m.corner && (
            <>
              <line
                x1={m.corner.tx1}
                y1={m.corner.ty1}
                x2={m.corner.tx2}
                y2={m.corner.ty2}
                className="map-corner-tick"
              />
              <rect
                x={m.corner.x - 3.5}
                y={m.corner.y - 3.5}
                width={7}
                height={7}
                className="map-corner-mark"
                transform={`rotate(45 ${m.corner.x} ${m.corner.y})`}
              />
              <text
                x={m.corner.lx}
                y={m.corner.ly}
                className="map-corner-label"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {m.short}
              </text>
              <text
                x={m.corner.lx}
                y={m.corner.ly + 11}
                className="map-s-label"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                S
              </text>
            </>
          )}
        </g>
      ))}
      <circle cx={pole[0]} cy={pole[1]} r={5} className="map-n-dot" />
      <text
        x={pole[0]}
        y={pole[1] - 10}
        className="map-n-label"
        textAnchor="middle"
      >
        N
      </text>
    </g>
  );
}