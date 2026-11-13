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
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Local build, serve and test settings only. CO-814 adds hosting and deploy.
export default defineConfig(() => ({
  root: __dirname,
  cacheDir:
    "../../../node_modules/.vite/apps/@parole-board/us-co-public-calendar",

  server: {
    port: 3060,
    host: "localhost",
  },

  preview: {
    port: 3061,
    host: "localhost",
  },

  plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-macros", "babel-plugin-styled-components"],
      },
    }),
    tsconfigPaths(),
  ],

  build: {
    outDir: "../../../dist/apps/@parole-board/us-co-public-calendar",
    emptyOutDir: true,
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
    // Without this, `nx test` stays in watch mode and never exits.
    watch: false,
    reporters: ["default"],
    coverage: {
      reportsDirectory:
        "../../../coverage/apps/@parole-board/us-co-public-calendar",
      provider: "v8",
    },
  },
}));
