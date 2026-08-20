import type { Plugin } from "vite";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
// @ts-expect-error JS plugin alongside the TS vite config
import { grokPwaPlugin } from "./scripts/grok-pwa-plugin.mjs";

function copyPgliteWasmAssets() {
  const dest = join(
    process.cwd(),
    ".vercel/output/functions/__server.func/_libs",
  );
  const src = join(process.cwd(), "node_modules/@electric-sql/pglite/dist");
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const file of ["pglite.data", "pglite.wasm", "initdb.wasm"] as const) {
    copyFileSync(join(src, file), join(dest, file));
  }
}

/**
 * Vercel’s tanstack-start builder deploys Nitro static files but often drops
 * the `__server` function, so `/` 404s. Snapshot SSR HTML into `static/` and
 * add an SPA fallback so the atlas is reachable without the function.
 */
async function writeVercelPrerender() {
  const outputDir = join(process.cwd(), ".vercel/output");
  const staticDir = join(outputDir, "static");
  const handlerPath = join(outputDir, "functions/__server.func/index.mjs");
  const configPath = join(outputDir, "config.json");
  if (!existsSync(handlerPath) || !existsSync(configPath)) return;

  const mod = (await import(pathToFileURL(handlerPath).href)) as {
    default?: { fetch?: (request: Request, context?: unknown) => Promise<Response> };
  };
  const fetchFn = mod.default?.fetch;
  if (typeof fetchFn !== "function") return;

  const context = { waitUntil() {} };
  for (const [path, outfile] of [
    ["/", "index.html"],
    ["/login", "login/index.html"],
  ] as const) {
    const response = await fetchFn(new Request(`http://127.0.0.1${path}`), context);
    if (!response.ok) {
      console.warn(`[vercel] prerender ${path} → ${response.status}`);
      continue;
    }
    const dest = join(staticDir, outfile);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, await response.text());
    console.info(`[vercel] prerendered ${path} → ${outfile}`);
  }

  const config = JSON.parse(readFileSync(configPath, "utf8")) as {
    routes?: Array<Record<string, unknown>>;
  };
  const routes = Array.isArray(config.routes) ? [...config.routes] : [];
  for (const route of routes) {
    if (route.headers && !route.dest && !route.handle) {
      route.continue = true;
    }
  }
  const kept = routes.filter(
    (route) => !(route.src === "/(.*)" && route.dest === "/__server"),
  );
  kept.push(
    { src: "/api/(.*)", dest: "/__server" },
    { src: "/(.*)", dest: "/index.html" },
  );
  config.routes = kept;
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Finish PGLite bootstrap during dev-server setup (before traffic). Vite awaits
 * async `configureServer` hooks. Production: `src/lib/db` kicks `ensureDbReady`
 * on import.
 */
function pgliteBootstrapPlugin(): Plugin {
  return {
    name: "app-builder:pglite-bootstrap",
    apply: "serve",
    async configureServer(server) {
      try {
        const mod = (await server.ssrLoadModule("/src/lib/db.ts")) as {
          ensureDbReady?: () => Promise<void>;
        };
        if (typeof mod.ensureDbReady === "function") {
          await mod.ensureDbReady();
        }
      } catch (err) {
        console.error("[app-builder] DB bootstrap failed:", err);
        throw err;
      }
    },
  };
}

/**
 * Live-preview OAuth popup — handled HERE so the agent never has to create a
 * `/auth/popup` route (and cannot break it by scaffolding a React page that
 * paints the full app shell in the popup).
 *
 * `signIn` (client.ts) opens `/auth/popup?providerId=…` in a top-level window.
 * This middleware runs before TanStack Start, calls `handleAuthPopupRequest`,
 * and returns the 302 / completion HTML. Deployed apps do not use the popup
 * (full-page OAuth redirect), so `apply: "serve"` is enough.
 */
function authPopupPlugin(): Plugin {
  return {
    name: "app-builder:auth-popup",
    apply: "serve",
    configureServer(server) {
      // Register immediately (not in a returned post-hook) so we run BEFORE
      // TanStack Start / the SPA HTML fallback. A model-authored
      // `src/routes/auth/popup.tsx` React page must never win this path.
      server.middlewares.use(async (req, res, next) => {
        try {
          const rawUrl = req.url ?? "";
          const pathOnly = rawUrl.split("?", 1)[0] ?? "";
          if (pathOnly !== "/auth/popup") {
            next();
            return;
          }
          if ((req.method ?? "GET").toUpperCase() !== "GET") {
            res.statusCode = 405;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("Method Not Allowed");
            return;
          }

          const host = String(
            req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:8080",
          );
          const proto = String(
            req.headers["x-forwarded-proto"] ??
              ((req.socket as { encrypted?: boolean } | undefined)?.encrypted ? "https" : "http"),
          );
          const requestHeaders = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (value === undefined) continue;
            if (Array.isArray(value)) {
              for (const v of value) requestHeaders.append(key, v);
            } else {
              requestHeaders.set(key, value);
            }
          }
          // Ensure Host is the public preview host so Better Auth's dynamic
          // baseURL / redirect_uri match the popup origin.
          if (!requestHeaders.has("host")) requestHeaders.set("host", host);

          const request = new Request(`${proto}://${host}${rawUrl}`, {
            method: "GET",
            headers: requestHeaders,
          });

          const mod = (await server.ssrLoadModule("/src/lib/auth/popup.server.ts")) as {
            handleAuthPopupRequest: (req: Request) => Promise<Response>;
          };
          const response = await mod.handleAuthPopupRequest(request);

          res.statusCode = response.status;
          // Preserve multiple Set-Cookie headers (OAuth state + session).
          const setCookies =
            typeof response.headers.getSetCookie === "function"
              ? response.headers.getSetCookie()
              : [];
          response.headers.forEach((value, key) => {
            if (key.toLowerCase() === "set-cookie") return;
            res.setHeader(key, value);
          });
          for (const cookie of setCookies) {
            res.appendHeader("set-cookie", cookie);
          }
          const body = Buffer.from(await response.arrayBuffer());
          res.end(body);
        } catch (err) {
          console.error("[app-builder] /auth/popup handler failed:", err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("auth popup failed");
          }
        }
      });
    },
  };
}

// `0.0.0.0:8080` is the live-preview contract — don't change host/port.
// The dev server starts once `src/router.tsx` and `src/routes/` exist — see
// AGENTS.md § "First scaffold".
export default defineConfig(({ command, isPreview }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 8081,
    strictPort: true,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    pgliteBootstrapPlugin(),
    // Before tanstackStart so /auth/popup never falls through to the SPA.
    authPopupPlugin(),
    // PWA head + ?install=1 tutorial page; runs before Start/Nitro.
    grokPwaPlugin(),
    tailwindcss(),
    tanstackStart(),
    ...(command === "build" || isPreview
      ? [
          nitro({
            preset: "vercel",
            // Auto-registers server/middleware/* (the PWA install page +
            // manifest + head-tag middleware). Nitro v3 defaults serverDir to
            // false, so removing this silently unwires /?install=1 on deploys.
            serverDir: "./server",
            hooks: {
              async compiled() {
                copyPgliteWasmAssets();
                await writeVercelPrerender();
              },
            },
          }),
        ]
      : []),
    viteReact(),
  ],
}));
