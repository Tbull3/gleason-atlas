import { geoPath, type GeoProjection } from "d3-geo";
import { MAP_RADIUS, MAP_SIZE, GEO_COUNTRIES } from "@/lib/geo";

/**
 * Gleason’s 1892 sheet printed a scale of geographical miles
 * (1′ of arc = 1 nautical mile) and a companion statute-mile bar.
 * 1° along a meridian from the pole is 60 geographical miles — true
 * on this azimuthal-equidistant disc. East–west stretches toward the ice.
 */
export const GEO_MILES_PER_DEGREE = 60;
/** Historical geographical mile of 6,080 ft (Admiralty), as used c. 1892. */
export const STATUTE_PER_GEO = 6080 / 5280;
export const KM_PER_GEO = (6080 * 0.3048) / 1000;
export const DISC_GEO_MILES = 180 * GEO_MILES_PER_DEGREE;
export const SVG_PER_GEO_MILE = MAP_RADIUS / DISC_GEO_MILES;

/**
 * Local sun and moon on this disc — ~33 miles across, ~3,000 miles
 * above the surface. Figures are statute miles, converted onto
 * Gleason’s geographical scale so they size with the map.
 */
export const BODY_DIAMETER_STATUTE = 33;
export const BODY_ALTITUDE_STATUTE = 3000;
export const BODY_DIAMETER_GEO = BODY_DIAMETER_STATUTE / STATUTE_PER_GEO;
export const BODY_ALTITUDE_GEO = BODY_ALTITUDE_STATUTE / STATUTE_PER_GEO;
export const BODY_RADIUS_SVG = (BODY_DIAMETER_GEO / 2) * SVG_PER_GEO_MILE;
/** On-screen bodies are enlarged; the key still lists the true 33 / 3,000 mi figures. */
export const BODY_DISPLAY_SCALE = 10;
export const BODY_RADIUS_DISPLAY_SVG = BODY_RADIUS_SVG * BODY_DISPLAY_SCALE;

/** The four cardinal meridians — the “four corners” of the disc at the ice. */
export const CARDINAL_MERIDIANS = [
  { lon: 0, label: "Greenwich", short: "Greenwich" },
  { lon: 90, label: "90°E", short: "90°E" },
  { lon: 180, label: "180°", short: "180°" },
  { lon: -90, label: "90°W", short: "90°W" },
] as const;

/** Radial mile rings that coincide with the familiar latitude circles. */
export const MILE_RINGS = [
  { geoMiles: 1800, lat: 60, caption: "60°N" },
  { geoMiles: 3600, lat: 30, caption: "30°N" },
  { geoMiles: 5400, lat: 0, caption: "Equator" },
  { geoMiles: 7200, lat: -30, caption: "30°S" },
  { geoMiles: 9000, lat: -60, caption: "60°S" },
] as const;

export type LonLat = { lon: number; lat: number };

export function svgToGeoMiles(svgDist: number) {
  return svgDist / SVG_PER_GEO_MILE;
}

export function colatitudeGeoMiles(lat: number) {
  return (90 - lat) * GEO_MILES_PER_DEGREE;
}

export function ringRadius(geoMiles: number) {
  return MAP_RADIUS * (geoMiles / DISC_GEO_MILES);
}

export function formatCount(n: number, digits = 0) {
  return n.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function formatGeoMiles(geo: number) {
  const digits = geo < 100 ? 1 : 0;
  return `${formatCount(geo, digits)} geo. mi`;
}

export function formatStatuteMiles(geo: number) {
  const statute = geo * STATUTE_PER_GEO;
  const digits = statute < 100 ? 1 : 0;
  return `${formatCount(statute, digits)} statute mi`;
}

export function formatKm(geo: number) {
  const km = geo * KM_PER_GEO;
  const digits = km < 100 ? 1 : 0;
  return `${formatCount(km, digits)} km`;
}

export function formatLonLat(lon: number, lat: number) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  const alat = Math.abs(lat);
  const alon = Math.abs(lon);
  return `${alat.toFixed(1)}°${ns} ${alon.toFixed(1)}°${ew}`;
}

export function invertLonLat(
  projection: GeoProjection,
  x: number,
  y: number,
): LonLat | null {
  const ll = projection.invert?.([x, y]);
  if (!ll || !Number.isFinite(ll[0]) || !Number.isFinite(ll[1])) return null;
  const dx = x - MAP_SIZE / 2;
  const dy = y - MAP_SIZE / 2;
  if (Math.hypot(dx, dy) > MAP_RADIUS + 6) return null;
  return { lon: ll[0], lat: ll[1] };
}

export function countryFromPole(key: string, projection: GeoProjection) {
  const country = GEO_COUNTRIES.find((c) => c.key === key);
  if (!country) return null;
  const centroid = geoPath(projection).centroid(country.feature);
  if (!Number.isFinite(centroid[0]) || !Number.isFinite(centroid[1])) {
    return null;
  }
  const ll = invertLonLat(projection, centroid[0], centroid[1]);
  if (!ll) return null;
  return {
    ...ll,
    geoMiles: colatitudeGeoMiles(ll.lat),
  };
}

export type MeasurePoint = {
  x: number;
  y: number;
  lon: number;
  lat: number;
};

export function projectMeasure(
  projection: GeoProjection,
  point: MeasurePoint,
): MeasurePoint {
  const xy = projection([point.lon, point.lat]);
  if (!xy || !Number.isFinite(xy[0]) || !Number.isFinite(xy[1])) return point;
  return { ...point, x: xy[0], y: xy[1] };
}

export function discMeasure(a: MeasurePoint, b: MeasurePoint) {
  const svg = Math.hypot(b.x - a.x, b.y - a.y);
  const geo = svgToGeoMiles(svg);
  return {
    geo,
    fromPoleA: colatitudeGeoMiles(a.lat),
    fromPoleB: colatitudeGeoMiles(b.lat),
  };
}
