import {
  geoAzimuthalEquidistant,
  geoGraticule,
  geoPath,
  type GeoProjection,
} from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import world from "world-atlas/countries-110m.json";
import { COUNTRY_BY_KEY, type CountryRecord } from "@/data/countries";

export const MAP_SIZE = 1000;
export const MAP_PAD = 42;
export const MAP_RADIUS = (MAP_SIZE - MAP_PAD * 2) / 2;

const collection = feature(
  world as never,
  (world as { objects: { countries: never } }).objects.countries,
) as unknown as FeatureCollection<Geometry, { name: string }>;

export type GeoCountry = {
  key: string;
  geoName: string;
  feature: Feature<Geometry, { name: string }>;
  record: CountryRecord | undefined;
};

export function countryKey(
  id: string | number | undefined | null,
  name: string,
): string {
  if (id !== undefined && id !== null && String(id).length > 0) {
    return String(id).padStart(3, "0");
  }
  return `name:${name}`;
}

export const GEO_COUNTRIES: GeoCountry[] = collection.features.map((f) => {
  const geoName = f.properties?.name ?? "Unknown";
  const key = countryKey(f.id as string | number | undefined, geoName);
  return {
    key,
    geoName,
    feature: f,
    record: COUNTRY_BY_KEY.get(key),
  };
});

export function createGleasonProjection(rotation = 0): GeoProjection {
  return geoAzimuthalEquidistant()
    .precision(0.2)
    .rotate([rotation, -90, 0])
    .clipAngle(180 - 1e-3)
    .fitExtent(
      [
        [MAP_PAD, MAP_PAD],
        [MAP_SIZE - MAP_PAD, MAP_SIZE - MAP_PAD],
      ],
      { type: "Sphere" },
    );
}

export function createPath(projection: GeoProjection) {
  return geoPath(projection);
}

export function createGraticulePath(projection: GeoProjection) {
  const path = geoPath(projection);
  const graticule = geoGraticule()
    .step([15, 15])
    .extent([
      [-180, -90],
      [180, 90],
    ]);
  return path(graticule()) ?? "";
}

export function createEquatorPath(projection: GeoProjection) {
  const path = geoPath(projection);
  const coordinates: [number, number][] = [];
  for (let lon = -180; lon <= 180; lon += 2) {
    coordinates.push([lon, 0]);
  }
  return path({ type: "LineString", coordinates }) ?? "";
}

export function spherePath(projection: GeoProjection) {
  return geoPath(projection)({ type: "Sphere" }) ?? "";
}

export type RimMark = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  major: boolean;
  label?: string;
  lx: number;
  ly: number;
};

function formatLongitude(lon: number): string {
  if (lon === 0) return "0°";
  if (lon === 180 || lon === -180) return "180°";
  return lon > 0 ? `${lon}°E` : `${Math.abs(lon)}°W`;
}

export function createRimMarks(projection: GeoProjection): RimMark[] {
  const cx = MAP_SIZE / 2;
  const cy = MAP_SIZE / 2;
  const r = MAP_RADIUS;
  const marks: RimMark[] = [];

  for (let lon = -180; lon < 180; lon += 15) {
    const p = projection([lon, -88]);
    if (!p) continue;
    const dx = p[0] - cx;
    const dy = p[1] - cy;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) continue;
    const ux = dx / len;
    const uy = dy / len;
    const major = lon % 45 === 0;
    const tick = major ? 12 : 6;
    marks.push({
      x1: cx + ux * r,
      y1: cy + uy * r,
      x2: cx + ux * (r + tick),
      y2: cy + uy * (r + tick),
      major,
      label: major ? formatLongitude(lon) : undefined,
      lx: cx + ux * (r + 22),
      ly: cy + uy * (r + 22),
    });
  }

  return marks;
}
