// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

/// <reference types='vitest' />
import { createRequire } from "node:module";
import path from "node:path";

import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, normalizePath, type Plugin } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import svgr from "vite-plugin-svgr";

const require = createRequire(import.meta.url);
const pdfjsWasmDir = normalizePath(
  path.join(path.dirname(require.resolve("pdfjs-dist/package.json")), "wasm"),
);

const DISALLOWED_API_URL_HOSTS = ["localhost", "127.0.0.1", "::1"];

function isDisallowedLocalApiUrl(apiUrl: string): boolean {
  if (apiUrl.startsWith("/")) {
    return false;
  }

  try {
    const hostname = new URL(apiUrl).hostname.replace(/^\[(.*)\]$/, "$1");
    return DISALLOWED_API_URL_HOSTS.includes(hostname);
  } catch {
    return false;
  }
}

function assertDeployableClientEnv(): Plugin {
  return {
    name: "idaho-th-client-env-guard",
    config(_config, { mode: buildMode }) {
      if (
        buildMode === "development" ||
        buildMode === "test" ||
        process.env["VITEST"]
      ) {
        return;
      }

      const env = loadEnv(buildMode, __dirname, "VITE_");
      const apiUrl = env["VITE_IDAHO_TH_API_URL"];
      if (!apiUrl) {
        return;
      }

      if (isDisallowedLocalApiUrl(apiUrl)) {
        throw new Error(
          `${buildMode} build: VITE_IDAHO_TH_API_URL must not point at localhost or 127.0.0.1. Use /api/trpc or omit it.`,
        );
      }
    },
  };
}

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: "../../../node_modules/.vite/apps/@idaho-th/client",

  server: {
    port: 4300,
    host: "localhost",
    proxy: {
      "/api": {
        target:
          process.env["IDAHO_TH_API_PROXY_TARGET"] ?? "http://localhost:3010",
        changeOrigin: true,
      },
    },
  },

  resolve: {
    // pdfjs-dist's default build targets only the newest browsers; the legacy
    // build ships the polyfills it needs. react-pdf imports bare "pdfjs-dist".
    alias: [
      { find: /^pdfjs-dist$/, replacement: "pdfjs-dist/legacy/build/pdf.mjs" },
    ],
  },

  plugins: [
    react(),
    svgr(),
    nxViteTsPaths(),
    assertDeployableClientEnv(),
    viteStaticCopy({
      // `rename` with `stripBase` flattens the copy regardless of how deep
      // pdfjs-dist sits under node_modules in this monorepo — without it,
      // files land at e.g. node_modules/pdfjs-dist/wasm/jbig2.wasm instead
      // of wasm/jbig2.wasm.
      targets: [
        { src: pdfjsWasmDir, dest: "wasm", rename: { stripBase: true } },
      ],
    }),
  ],

  build: {
    outDir: "../../../dist/apps/@idaho-th/client",
    reportCompressedSize: true,
    emptyOutDir: true,
  },

  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    passWithNoTests: true,
  },
}));
