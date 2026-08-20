#!/usr/bin/env node
/**
 * Snapshot Nitro SSR HTML into `.vercel/output/static` so Vercel can serve
 * the atlas when the `__server` function is not attached.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const outputDir = join(process.cwd(), ".vercel/output");
const staticDir = join(outputDir, "static");
const handlerPath = join(outputDir, "functions/__server.func/index.mjs");
const configPath = join(outputDir, "config.json");

if (!existsSync(handlerPath) || !existsSync(configPath)) {
  console.warn("[prerender] no Vercel output — skipping");
  process.exit(0);
}

const mod = await import(pathToFileURL(handlerPath).href);
const fetchFn = mod.default?.fetch;
if (typeof fetchFn !== "function") {
  console.error("[prerender] Nitro handler has no fetch export");
  process.exit(1);
}

const context = { waitUntil() {} };
for (const [path, outfile] of [
  ["/", "index.html"],
  ["/login", "login/index.html"],
]) {
  const response = await fetchFn(new Request(`http://127.0.0.1${path}`), context);
  if (!response.ok) {
    console.warn(`[prerender] ${path} → ${response.status}`);
    continue;
  }
  const dest = join(staticDir, outfile);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, await response.text());
  console.info(`[prerender] ${path} → ${outfile} (${response.headers.get("content-type")})`);
}

const config = JSON.parse(readFileSync(configPath, "utf8"));
const routes = Array.isArray(config.routes) ? [...config.routes] : [];
for (const route of routes) {
  if (route.headers && !route.dest && !route.handle) {
    route.continue = true;
  }
}
config.routes = [
  ...routes.filter(
    (route) =>
      !(
        (route.src === "/(.*)" &&
          (route.dest === "/__server" || route.dest === "/index.html")) ||
        (route.src === "/api/(.*)" && route.dest === "/__server")
      ),
  ),
  { src: "/api/(.*)", dest: "/__server" },
  { src: "/(.*)", dest: "/index.html" },
];
writeFileSync(configPath, JSON.stringify(config, null, 2));
console.info("[prerender] patched .vercel/output/config.json");
