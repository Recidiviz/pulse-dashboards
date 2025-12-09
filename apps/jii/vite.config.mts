// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// ignoring the nx rules here since this is just tooling,
// and we don't want to import the entire library here anyway
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  REENTRY_BACKEND_PATH,
  REENTRY_DEV_BACKEND_PATH,
} from "../../libs/@jii/case-planning/src/constants";

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/apps/jii",

  server: {
    port: 4200,
    host: "localhost",
    // result here should be equivalent to that in apps/jii-reverse-proxy
    proxy: {
      [REENTRY_BACKEND_PATH]: {
        target: process.env["CASE_PLANNING_PROXY_TARGET"],
        ws: true,
        changeOrigin: true,
        rewrite: (path) => {
          return path.replace(REENTRY_BACKEND_PATH, "");
        },
        configure(proxy) {
          // not all environments need this necessarily, but use it if configured
          const proxyOrigin = process.env["CASE_PLANNING_PROXY_ORIGIN"];
          if (!proxyOrigin) return;

          proxy.on("proxyReqWs", (req) => {
            // this overrides CORS restrictions for development
            req.setHeader("Origin", proxyOrigin);
          });
        },
      },
      [REENTRY_DEV_BACKEND_PATH]: {
        target: process.env["CASE_PLANNING_DEV_PROXY_TARGET"],
        ws: true,
        changeOrigin: true,
        rewrite: (path) => {
          return path.replace(REENTRY_DEV_BACKEND_PATH, "");
        },
        configure(proxy) {
          // not all environments need this necessarily, but use it if configured
          const proxyOrigin = process.env["CASE_PLANNING_DEV_PROXY_ORIGIN"];
          if (!proxyOrigin) return;

          proxy.on("proxyReqWs", (req) => {
            // this overrides CORS restrictions for development
            req.setHeader("Origin", proxyOrigin);
          });
        },
      },
    },
  },

  preview: {
    port: 4300,
    host: "localhost",
  },

  plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-macros", "babel-plugin-styled-components"],
      },
    }),
    nxViteTsPaths(),
  ],

  build: {
    outDir: "../../dist/apps/jii",
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },

  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    setupFiles: ["./src/setupTests.ts"],
    globalSetup: ["src/setupTestsGlobal.ts"],
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    reporters: ["default"],
    coverage: {
      reportsDirectory: "../../coverage/apps/jii",
      provider: "v8",
    },
  },
}));
