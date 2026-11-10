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

import { resolve } from "node:path";

import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { coverageConfigDefaults } from "vitest/config";

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: "../../../node_modules/.vite/libs/@idaho-th/client",
  plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-macros", "babel-plugin-styled-components"],
      },
    }),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(["*.md"]),
  ],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  test: {
    // A negative-UTC timezone is where the calendar-date bug reproduces. This is
    // the only place the suite's timezone is set: `test.env` is applied per worker,
    // so a `globalSetup` that assigns process.env.TZ would be overridden here and
    // silently do nothing.
    env: { TZ: "America/New_York" },
    mockReset: true,
    unstubEnvs: true,
    setupFiles: ["src/setupTests.ts"],
    // vite-plugin-svgr is not in the test pipeline, so every `*.svg?react`
    // import would otherwise resolve to a URL string that React cannot render.
    alias: [
      {
        // A RegExp alias replaces only the matched substring, so this has to
        // match the whole specifier, not just its suffix.
        find: /^.*\.svg\?react$/,
        replacement: resolve(__dirname, "src/test/svgStub.tsx"),
      },
    ],
    passWithNoTests: true,
    name: "@idaho-th/client",
    watch: false,
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "../../../coverage/libs/@idaho-th/client",
      provider: "v8" as const,
      reporter: ["text", "html", "json-summary", "json"],
      // `exclude` replaces the defaults rather than merging with them, so the
      // defaults have to be spread back in or every test file gets measured.
      // Everything listed below carries no branches worth asserting; anything
      // with real logic — including *.styles.tsx, which holds conditional
      // styles — stays in scope.
      exclude: [
        ...coverageConfigDefaults.exclude,
        "src/**/index.ts", // barrels: re-exports only
        "src/**/index.tsx", // barrels: re-exports only
        "src/**/types.ts", // type-only modules
        "src/**/*.d.ts",
        "src/@types/**",
        "src/setupTests.ts",
        "src/test/**", // shared test harness and fixtures
        "src/components/assets/**", // SVG-as-component imports
      ],
      // Ratchet, not a target: raise these as coverage lands so a regression
      // fails the run immediately. Function coverage reaching parity with
      // statement coverage is the signal that tests actually drive the
      // handlers, not just mount the components.
      thresholds: {
        statements: 89,
        branches: 86,
        functions: 85,
        lines: 89,
      },
    },
  },
}));
