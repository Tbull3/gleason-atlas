# Gleason Atlas

A polar choropleth of the world on Alexander Gleason’s 1892 azimuthal equidistant projection — North Pole at the centre, Antarctica as the outer ice ring.

Switch metrics (HDI, life expectancy, GDP, population, CO₂, density, area), hover for a reading, click a country for the full sheet, pan/zoom/rotate the disc.

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

TanStack Start + Nitro (`preset: "vercel"`). The build writes Vercel’s Build Output API and prerenders `/` and `/login` into static HTML so the map is served even if the serverless function is not attached.

Optional: set `DATABASE_URL` (Neon Postgres) for persistent auth. Without it the map is fully usable; Google / X sign-in needs those broker credentials on the host.