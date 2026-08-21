import assert from "node:assert/strict";
import test from "node:test";

const GEO_MILES_PER_DEGREE = 60;
const STATUTE_PER_GEO = 6080 / 5280;
const DISC_GEO_MILES = 180 * GEO_MILES_PER_DEGREE;

test("Gleason geographical mile is one minute of arc", () => {
  assert.equal(90 * GEO_MILES_PER_DEGREE, 5400);
  assert.equal(DISC_GEO_MILES, 10800);
});

test("pole-to-equator and pole-to-ice on the disc", () => {
  const equator = (90 - 0) * GEO_MILES_PER_DEGREE;
  const ice = (90 - -90) * GEO_MILES_PER_DEGREE;
  assert.equal(equator, 5400);
  assert.equal(ice, 10800);
});

test("1892 statute conversion uses the 6080-ft geographical mile", () => {
  assert.ok(Math.abs(STATUTE_PER_GEO - 1.151515) < 1e-5);
  const thousandStatute = 1000 * STATUTE_PER_GEO;
  assert.equal(Math.round(thousandStatute), 1152);
});

test("paper chord of 90° of colatitude is 5400 geo. mi", () => {
  const svgPerGeo = 1;
  const svg = 5400 * svgPerGeo;
  assert.equal(svg / svgPerGeo, 90 * GEO_MILES_PER_DEGREE);
});

test("four cardinal meridians are 90° apart", () => {
  const lons = [0, 90, 180, -90];
  for (let i = 0; i < lons.length; i++) {
    const a = lons[i];
    const b = lons[(i + 1) % lons.length];
    const delta = Math.abs(((b - a + 540) % 360) - 180);
    assert.equal(delta, 90);
  }
});
