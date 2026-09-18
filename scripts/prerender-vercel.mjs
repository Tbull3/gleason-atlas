#!/usr/bin/env node
/**
 * Snapshot Nitro SSR HTML into the Vercel static folder (and a sibling `dist/`
 * copy) so the atlas is served even if Vercel collects `.vercel/output` before
 * a later npm script can run.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const cwd = process.cwd();
const required = process.env.PRERENDER_REQUIRED === "1";
const distDir = join(cwd, "dist");

function listDir(dir) {
  try {
    return readdirSync(dir).join(",");
  } catch {
    return "(unreadable)";
  }
}

function findOutputDir() {
  const candidates = [
    join(cwd, ".vercel/output"),
    "/vercel/output",
    join(cwd, ".output"),
  ];
  for (const dir of candidates) {
    if (
      existsSync(join(dir, "config.json")) ||
      existsSync(join(dir, "functions/__server.func/index.mjs"))
    ) {
      return dir;
    }
  }
  return null;
}

function copyStaticToDist(staticDir) {
  if (!existsSync(staticDir)) return;
  mkdirSync(distDir, { recursive: true });
  cpSync(staticDir, distDir, { recursive: true });
  console.info("[prerender] copied", staticDir, "→ dist");
}

const outputDir = findOutputDir();
if (!outputDir) {
  if (existsSync(join(distDir, "index.html"))) {
    console.info("[prerender] BOA gone — dist/index.html already present");
    process.exit(0);
  }
  console.warn("[prerender] no Vercel output — skipping");
  console.warn("[prerender] cwd=", cwd, "entries=", listDir(cwd));
  console.warn("[prerender] .vercel=", listDir(join(cwd, ".vercel")));
  console.warn("[prerender] /vercel=", listDir("/vercel"));
  if (required) {
    console.error("[prerender] required, but no output dir and no dist/index.html");
    process.exit(1);
  }
  process.exit(0);
}

const staticDir = join(outputDir, "static");
const handlerPath = join(outputDir, "functions/__server.func/index.mjs");
const configPath = join(outputDir, "config.json");
console.info("[prerender] using", outputDir);

if (!existsSync(handlerPath)) {
  copyStaticToDist(staticDir);
  console.error("[prerender] missing handler", handlerPath);
  process.exit(required ? 1 : 0);
}

const mod = await import(pathToFileURL(handlerPath).href);
const fetchFn = mod.default?.fetch;
if (typeof fetchFn !== "function") {
  copyStaticToDist(staticDir);
  console.error("[prerender] Nitro handler has no fetch export");
  process.exit(1);
}

const context = { waitUntil() {} };
let wrote = 0;
for (const [path, outfile] of [
  ["/", "index.html"],
]) {
  const response = await fetchFn(new Request(`http://127.0.0.1${path}`), context);
  if (!response.ok) {
    console.warn(`[prerender] ${path} → ${response.status}`);
    continue;
  }
  const dest = join(staticDir, outfile);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, await response.text());
  console.info(`[prerender] ${path} → ${outfile}`);
  wrote += 1;
}

if (wrote > 0 && existsSync(join(staticDir, "index.html"))) {
  const loginDest = join(staticDir, "login/index.html");
  mkdirSync(dirname(loginDest), { recursive: true });
  writeFileSync(loginDest, '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/"><title>Gleason Atlas</title><script>location.replace("/" + location.hash)</script></head><body><a href="/">Open Gleason Atlas</a></body></html>');
  console.info("[prerender] /login → login/index.html (redirect)");
}

if (wrote === 0) {
  console.error("[prerender] wrote 0 pages");
  copyStaticToDist(staticDir);
  process.exit(1);
}

if (existsSync(configPath)) {
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
  console.info("[prerender] patched config.json");
}

copyStaticToDist(staticDir);
if (!existsSync(join(distDir, "index.html"))) {
  console.error("[prerender] dist/index.html missing after copy");
  process.exit(1);
}
console.info("[prerender] dist/index.html ready");
process.exit(0);
