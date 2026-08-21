# Gleason Atlas

A polar choropleth of the world on Alexander Gleason’s 1892 azimuthal equidistant projection — North Pole at the centre, Antarctica as the outer ice ring.

Switch metrics (HDI, life expectancy, GDP, population, CO₂, density, area), hover for a reading, click a country for the full sheet, pan/zoom/rotate the disc, and switch viewing planes (overhead, pole, rim, transverse). The ruler shows Gleason’s 1892 geographical-mile scale, the four cardinal meridians at the ice, and click-to-measure on the disc. The sun and moon sit at their live overhead points, 33 miles across and 3,000 miles above the disc. The clock uses the viewer’s timezone, with US Central as a pin.

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
