# Gleason Atlas

A polar choropleth of the world on Alexander Gleason’s 1892 azimuthal equidistant projection — North Pole at the centre, Antarctica as the outer ice ring.

Switch metrics (HDI, life expectancy, GDP, population, CO₂, density, area), hover for a reading, click a country for the full sheet, pan/zoom/rotate the disc, and switch viewing planes (overhead, pole, rim, transverse). The ruler shows Gleason’s 1892 geographical-mile scale, the four cardinal meridians at the ice, and click-to-measure on the disc. The sun and moon sit at their live overhead points, 33 miles across and 3,000 miles above the disc. Scrub the hour and the year from the clock (solstice and equinox pins), and mark your place to see whether you stand in the lamp. Hours around the ice are solar time. The clock uses the viewer’s timezone, with US Central as a pin.

The atlas is open to browse — no account required.

Figures are illustrative 2024 estimates compiled for comparison, not official statistics.

## Live

**https://gleason-atlas.vercel.app**

GitHub: [Tbull3/gleason-atlas](https://github.com/Tbull3/gleason-atlas)  
Vercel project: `gleason-atlas` (production branch `main`)

Push to `main` to republish.

## Local

```bash
npm install
npm run dev
```

Build (Vercel / production):

```bash
npm run build
```

## Deploy

TanStack Start + Nitro (`preset: "vercel"`). The build writes Vercel’s Build Output API and prerenders `/` into static HTML so the map is served even if the serverless function is not attached.

## Independent operation

The public map uses bundled country data and browser-side calculations. It needs
no API keys, database, authentication service, or Grok account. Its celestial
geometry is the application's visualization model. No external database or
account was deleted during the migration.

Use Node.js 24 and `npm ci` for reproducible setup. Run `npm run typecheck`,
`npm test`, and `npm run build` before publication. `npm run test:browser -- URL`
checks the built site on desktop and mobile; install Chromium first with
`npx playwright install chromium`. Browser artifacts go into `artifacts/qa`.

Keep `scripts/prerender-vercel.mjs` and the Vite prerender hooks. They preserve
static HTML, `/login` handling, and JavaScript asset delivery on Vercel.
Share-card metadata is owned directly by `src/routes/__root.tsx` and uses
`public/og.jpg` at the live domain.

For a change, push an isolated branch, verify its Vercel preview, then merge into
`main` to publish through the existing GitHub integration. Check the production
commit and map after publication. The pre-migration production commit is
`f09834212dcbf3d21a882dea0b65ac8ad682d2e1`, deployment
`dpl_H1vrqQYroEcGoenkeY6BJQmw5aRv`. Retain it as a rollback point. Revert the
migration commit on `main`, or use Vercel's rollback to that deployment if needed.
