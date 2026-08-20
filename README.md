# Gleason Atlas

A polar choropleth of the world on Alexander Gleason’s 1892 azimuthal equidistant projection — North Pole at the centre, Antarctica as the outer ice ring.

Switch metrics (HDI, life expectancy, GDP, population, CO₂, density, area), hover for a reading, click a country for the full sheet, pan/zoom/rotate the disc.

Figures are illustrative 2024 estimates compiled for comparison, not official statistics.

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

This app is a TanStack Start + Nitro project. Vercel detects the framework from `vite.config.ts` (`nitro({ preset: "vercel" })`). Set `DATABASE_URL` to a Postgres connection string (Neon) for persistent auth; without it the build still runs and the map is fully usable.
