/**
 * Compact Meeus/NOAA ephemeris for the Gleason disc.
 * Positions are the geographic subsolar and sublunar points — where
 * the body is overhead — which is how the 1892 time-chart places the sun.
 * Accurate to a few tenths of a degree, enough at this map scale.
 */

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

export const CENTRAL_TZ = "America/Chicago";

export function wrapDeg(d: number) {
  return ((d % 360) + 360) % 360;
}

export function wrapLon(lon: number) {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

function sind(d: number) {
  return Math.sin(d * DEG);
}
function cosd(d: number) {
  return Math.cos(d * DEG);
}

export function toJulian(date: Date) {
  return date.getTime() / 86400000 + 2440587.5;
}

export function julianCenturies(jd: number) {
  return (jd - 2451545) / 36525;
}

/** Greenwich mean sidereal time in degrees. */
export function gmstDegrees(jd: number) {
  const T = julianCenturies(jd);
  const theta =
    280.46061837 +
    360.98564736629 * (jd - 2451545) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  return wrapDeg(theta);
}

export type Equatorial = { ra: number; dec: number };

export function sunEquatorial(jd: number): Equatorial & { lambda: number } {
  const T = julianCenturies(jd);
  const L0 = wrapDeg(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = wrapDeg(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * sind(M) +
    (0.019993 - 0.000101 * T) * sind(2 * M) +
    0.000289 * sind(3 * M);
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLong - 0.00569 - 0.00478 * sind(omega);
  const eps0 =
    23.439291 -
    0.0130042 * T -
    1.64e-7 * T * T +
    5.036e-7 * T * T * T;
  const eps = eps0 + 0.00256 * cosd(omega);
  const ra = wrapDeg(Math.atan2(cosd(eps) * sind(lambda), cosd(lambda)) * RAD);
  const dec = Math.asin(sind(eps) * sind(lambda)) * RAD;
  return { ra, dec, lambda };
}

/** Ecliptic → equatorial, mean obliquity of date. */
function eclipticToEquatorial(
  lambda: number,
  beta: number,
  jd: number,
): Equatorial {
  const T = julianCenturies(jd);
  const eps =
    23.439291 -
    0.0130042 * T -
    1.64e-7 * T * T +
    5.036e-7 * T * T * T;
  const ra = wrapDeg(
    Math.atan2(
      sind(lambda) * cosd(eps) - tand(beta) * sind(eps),
      cosd(lambda),
    ) * RAD,
  );
  const dec =
    Math.asin(
      sind(beta) * cosd(eps) + cosd(beta) * sind(eps) * sind(lambda),
    ) * RAD;
  return { ra, dec };
}

function tand(d: number) {
  return Math.tan(d * DEG);
}

type MoonTerm = [coeff: number, D: number, M: number, Mp: number, F: number];

/** Largest periodic terms from Meeus, Tables 47.A and 47.B (units 1e-6 deg). */
const MOON_LON: MoonTerm[] = [
  [6288774, 0, 0, 1, 0],
  [1274027, 2, 0, -1, 0],
  [658314, 2, 0, 0, 0],
  [213618, 0, 0, 2, 0],
  [-185116, 0, 1, 0, 0],
  [-114332, 0, 0, 0, 2],
  [58793, 2, 0, -2, 0],
  [57066, 2, -1, -1, 0],
  [53322, 2, 0, 1, 0],
  [45758, 2, -1, 0, 0],
  [-40923, 0, 1, -1, 0],
  [-34720, 1, 0, 0, 0],
  [-30383, 0, 1, 1, 0],
  [15327, 2, 0, 0, -2],
  [-12528, 0, 0, 1, 2],
  [10980, 0, 0, 1, -2],
  [10675, 4, 0, -1, 0],
  [10034, 0, 0, 3, 0],
  [8548, 4, 0, -2, 0],
  [-7888, 2, 1, -1, 0],
];

const MOON_LAT: MoonTerm[] = [
  [5128122, 0, 0, 0, 1],
  [280602, 0, 0, 1, 1],
  [277693, 0, 0, 1, -1],
  [173237, 2, 0, 0, -1],
  [55413, 2, 0, -1, 1],
  [46271, 2, 0, -1, -1],
  [32573, 2, 0, 0, 1],
  [17198, 0, 0, 2, 1],
  [9266, 2, 0, 1, -1],
  [8822, 0, 0, 2, -1],
];

function sumMoonTerms(
  terms: MoonTerm[],
  D: number,
  M: number,
  Mp: number,
  F: number,
  E: number,
) {
  let sum = 0;
  for (const [coeff, d, m, mp, f] of terms) {
    const arg = d * D + m * M + mp * Mp + f * F;
    const scale = m === 0 ? 1 : m === 1 || m === -1 ? E : E * E;
    sum += coeff * scale * sind(arg);
  }
  return sum / 1e6;
}

export function moonEquatorial(jd: number): Equatorial {
  const T = julianCenturies(jd);
  const Lp = wrapDeg(
    218.3164477 +
      481267.88123421 * T -
      0.0015786 * T * T +
      (T * T * T) / 538841,
  );
  const D = wrapDeg(
    297.8501921 + 445267.1114034 * T - 0.0018819 * T * T,
  );
  const M = wrapDeg(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T);
  const Mp = wrapDeg(
    134.9633964 + 477198.8675055 * T + 0.0087414 * T * T,
  );
  const F = wrapDeg(93.272095 + 483202.0175233 * T - 0.0036539 * T * T);
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;
  const lambda = wrapDeg(Lp + sumMoonTerms(MOON_LON, D, M, Mp, F, E));
  const beta = sumMoonTerms(MOON_LAT, D, M, Mp, F, E);
  return eclipticToEquatorial(lambda, beta, jd);
}

export type GeoPoint = { lat: number; lon: number };

function subpoint(eq: Equatorial, jd: number): GeoPoint {
  const gha = wrapDeg(gmstDegrees(jd) - eq.ra);
  return { lat: eq.dec, lon: wrapLon(-gha) };
}

export function angularDistance(
  a: GeoPoint,
  b: GeoPoint,
) {
  const s =
    sind(a.lat) * sind(b.lat) +
    cosd(a.lat) * cosd(b.lat) * cosd(a.lon - b.lon);
  return Math.acos(Math.max(-1, Math.min(1, s))) * RAD;
}

export function moonPhaseName(illumination: number, waxing: boolean) {
  if (illumination < 0.03) return "New moon";
  if (illumination > 0.97) return "Full moon";
  if (Math.abs(illumination - 0.5) < 0.04) {
    return waxing ? "First quarter" : "Last quarter";
  }
  if (illumination < 0.5) {
    return waxing ? "Waxing crescent" : "Waning crescent";
  }
  return waxing ? "Waxing gibbous" : "Waning gibbous";
}

export type SkyState = {
  sun: GeoPoint;
  moon: GeoPoint;
  illumination: number;
  waxing: boolean;
  phaseName: string;
};

export function skyAt(date: Date): SkyState {
  const jd = toJulian(date);
  const sunEq = sunEquatorial(jd);
  const moonEq = moonEquatorial(jd);
  const sun = subpoint(sunEq, jd);
  const moon = subpoint(moonEq, jd);
  const elongation = angularDistance(
    { lat: sunEq.dec, lon: sunEq.ra },
    { lat: moonEq.dec, lon: moonEq.ra },
  );
  const illumination = (1 - Math.cos(elongation * DEG)) / 2;
  const dLon = wrapLon(moon.lon - sun.lon);
  const waxing = dLon > 0;
  return {
    sun,
    moon,
    illumination,
    waxing,
    phaseName: moonPhaseName(illumination, waxing),
  };
}

export function viewerTimeZone() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone) return zone;
  } catch {
    /* ignore */
  }
  return CENTRAL_TZ;
}

/** Offset of a named zone from UTC, in hours (CDT → -5). */
export function zoneOffsetHours(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUtc - date.getTime()) / 3600000;
}

/** Standard meridian for a civil timezone (15° per hour from Greenwich). */
export function zoneMeridian(date: Date, timeZone: string) {
  return wrapLon(zoneOffsetHours(date, timeZone) * 15);
}

export function formatClock(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h12",
  }).format(date);
}

export function formatZoneAbbrev(date: Date, timeZone: string) {
  const part = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short",
    hour: "numeric",
  })
    .formatToParts(date)
    .find((p) => p.type === "timeZoneName");
  return part?.value ?? timeZone;
}

export function formatZoneLabel(timeZone: string) {
  if (timeZone === CENTRAL_TZ) return "Central";
  const city = timeZone.split("/").pop()?.replace(/_/g, " ");
  return city ?? timeZone;
}
