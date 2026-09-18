import type { Plugin } from "vite";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
function finalizeVercelStatic(required: boolean) {
  if (!handlerExists()) {
    if (required) {
      throw new Error("prerender-vercel: Nitro handler missing");
    }
    return;
  }
  runPrerender(required);
}

function runPrerender(required: boolean) {
  const result = spawnSync(
    process.execPath,
    [join(process.cwd(), "scripts/prerender-vercel.mjs")],
    {
      stdio: "inherit",
      cwd: process.cwd(),
      env: {
        ...process.env,
        PRERENDER_REQUIRED: required ? "1" : "0",
      },
    },
  );
  if (result.status !== 0) {
    throw new Error(
      `prerender-vercel failed with status ${result.status ?? "null"}`,
    );
  }
}

function handlerExists() {
  return existsSync(
    join(process.cwd(), ".vercel/output/functions/__server.func/index.mjs"),
  );
}

/**
 * Prerender while Nitro's `.vercel/output` still exists — Vercel CLI collects
 * that folder as soon as `config.json` is written (the `compiled` hook).
 * `closeBundle` on the nitro environment runs after the server bundle is on
 * disk and before the Vercel preset writes config.json.
 */
function prerenderVercelPlugin(): Plugin {
  return {
    name: "gleason-atlas:prerender-vercel",
    apply: "build",
    closeBundle: {
      sequential: true,
      order: "post",
      handler() {
        const name = this.environment?.name;
        if (name && name !== "nitro") return;
        if (!handlerExists()) {
          if (name === "nitro") {
            throw new Error(
              "prerender-vercel: Nitro handler missing after nitro bundle",
            );
          }
          return;
        }
        finalizeVercelStatic(true);
      },
    },
  };
}

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
    tailwindcss(),
    tanstackStart(),
    ...(command === "build" || isPreview
      ? [
          nitro({
            preset: "vercel",
            hooks: {
              compiled() {
                finalizeVercelStatic(false);
              },
            },
          }),
        ]
      : []),
    viteReact(),
    prerenderVercelPlugin(),
  ],
}));
