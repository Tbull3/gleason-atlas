import assert from "node:assert/strict";
import test from "node:test";

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function wrapDeg(d) {
  return ((d % 360) + 360) % 360;
}
function wrapLon(lon) {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}
function sind(d) {
  return Math.sin(d * DEG);
}
function cosd(d) {
  return Math.cos(d * DEG);
}
function toJulian(date) {
  return date.getTime() / 86400000 + 2440587.5;
}
function julianCenturies(jd) {
  return (jd - 2451545) / 36525;
}
function gmstDegrees(jd) {
  const T = julianCenturies(jd);
  const theta =
    280.46061837 +
    360.98564736629 * (jd - 2451545) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  return wrapDeg(theta);
}

function sunEquatorial(jd) {
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
    23.439291 - 0.0130042 * T - 1.64e-7 * T * T + 5.036e-7 * T * T * T;
  const eps = eps0 + 0.00256 * cosd(omega);
  const ra = wrapDeg(Math.atan2(cosd(eps) * sind(lambda), cosd(lambda)) * RAD);
  const dec = Math.asin(sind(eps) * sind(lambda)) * RAD;
  return { ra, dec };
}

function subsolar(date) {
  const jd = toJulian(date);
  const sun = sunEquatorial(jd);
  const gha = wrapDeg(gmstDegrees(jd) - sun.ra);
  return { lat: sun.dec, lon: wrapLon(-gha) };
}

test("June 2026 solstice sun sits near the Tropic of Cancer", () => {
  const sun = subsolar(new Date("2026-06-21T08:24:00Z"));
  assert.ok(Math.abs(sun.lat - 23.44) < 0.15, `dec ${sun.lat}`);
});

test("December 2025 solstice sun sits near the Tropic of Capricorn", () => {
  const sun = subsolar(new Date("2025-12-21T15:03:00Z"));
  assert.ok(Math.abs(sun.lat + 23.44) < 0.2, `dec ${sun.lat}`);
});

test("March 2026 equinox sun is on the equator", () => {
  const sun = subsolar(new Date("2026-03-20T14:46:00Z"));
  assert.ok(Math.abs(sun.lat) < 0.3, `dec ${sun.lat}`);
});

test("sun at 12:00 UTC is near Greenwich (equation of time aside)", () => {
  const sun = subsolar(new Date("2026-08-21T12:00:00Z"));
  assert.ok(Math.abs(sun.lon) < 20, `lon ${sun.lon}`);
});

test("sun moves west about 15° per hour", () => {
  const a = subsolar(new Date("2026-08-21T16:00:00Z"));
  const b = subsolar(new Date("2026-08-21T17:00:00Z"));
  const dlon = wrapLon(b.lon - a.lon);
  assert.ok(Math.abs(dlon + 15) < 0.2, `dlon ${dlon}`);
});

test("Central daylight meridian is 75°W", () => {
  const date = new Date("2026-08-21T17:00:00Z");
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
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
  const offsetHours = (asUtc - date.getTime()) / 3600000;
  assert.equal(offsetHours, -5);
  assert.equal(offsetHours * 15, -75);
});

test("illuminated fraction is (1 - cos elongation) / 2", () => {
  assert.equal((1 - Math.cos(0)) / 2, 0);
  assert.ok(Math.abs((1 - Math.cos(Math.PI)) / 2 - 1) < 1e-10);
  assert.ok(Math.abs((1 - Math.cos(Math.PI / 2)) / 2 - 0.5) < 1e-10);
});

test("sun and moon are 33 statute miles across, 3,000 miles up on the Gleason scale", () => {
  const STATUTE_PER_GEO = 6080 / 5280;
  const DISC_GEO_MILES = 10800;
  const diameterGeo = 33 / STATUTE_PER_GEO;
  const altitudeGeo = 3000 / STATUTE_PER_GEO;
  assert.ok(Math.abs(diameterGeo - 28.66) < 0.02);
  assert.ok(Math.abs(altitudeGeo - 2605.26) < 0.05);
  const heightRatio = altitudeGeo / DISC_GEO_MILES;
  assert.ok(heightRatio > 0.23 && heightRatio < 0.25);
  const MAP_RADIUS = (1000 - 42 * 2) / 2;
  const bodySvg = (diameterGeo / DISC_GEO_MILES) * MAP_RADIUS;
  assert.ok(bodySvg < 2, `33-mile body is ${bodySvg} svg units`);
  const display = bodySvg * 10;
  assert.ok(display > 8 && display < 14, `10× body is ${display} svg units`);
});

