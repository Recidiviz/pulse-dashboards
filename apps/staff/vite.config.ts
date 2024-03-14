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
import { defineConfig, splitVendorChunkPlugin } from "vite";
import macros from "vite-plugin-babel-macros";
import { comlink } from "vite-plugin-comlink";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/apps/staff",

  server: {
    port: 3000,
    host: "localhost",
  },

  preview: {
    port: 5000,
    host: "localhost",
  },

  plugins: [
    comlink(),
    react({
      babel: {
        plugins: ["babel-plugin-macros"],
      },
    }),
    macros(),
    svgr(),
    nxViteTsPaths(),
    splitVendorChunkPlugin(),
  ],

  worker: {
    plugins: () => [comlink(), nxViteTsPaths()],
  },

  build: {
    outDir: "../../dist/apps/staff",
    sourcemap: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    emptyOutDir: true,
  },

  test: {
    globals: true,
    cache: {
      dir: "../../node_modules/.vitest",
    },
    environment: "jsdom",
    setupFiles: ["src/setupTests.tsx"],
    globalSetup: ["src/setupTestsGlobal.ts"],
    include: [
      "src/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "src/**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    exclude: ["src/**/testUtils.*"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "../../coverage/apps/staff",
      provider: "v8",
      reporter: "lcov",
    },
    mockReset: true,
    unstubEnvs: true,
    server: {
      deps: {
        inline: [/@rmwc\/.*/],
      },
    },
  },
});
