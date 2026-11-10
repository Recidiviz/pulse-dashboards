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
import { workspaceRoot } from "@nx/devkit";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { join } from "path";
import { defineConfig, loadEnv } from "vite";
import { coverageConfigDefaults } from "vitest/config";

export default defineConfig(({ mode }) => ({
  root: __dirname,
  cacheDir: "../../../node_modules/.vite/apps/@idaho-th/server",

  plugins: [nxViteTsPaths()],
  test: {
    passWithNoTests: true,
    name: "@idaho-th/server",
    globals: true,
    cache: { dir: "../../../node_modules/.vitest" },
    environment: "node",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "../../../coverage/apps/@idaho-th/server",
      provider: "v8",
      reporter: ["text", "html", "json-summary", "json"],
      // Spread the defaults first: supplying `exclude` replaces them, which
      // would pull every *.test.ts and __tests__/ file into the measurement.
      exclude: [
        ...coverageConfigDefaults.exclude,
        "src/test/**", // test helpers would credit themselves
        "**/index.ts", // barrels: re-exports only
        "**/*.types.ts", // type-only modules
        "**/*.d.ts",
        "src/main.ts", // process bootstrap: builds the Fastify server and listens
        "src/workers/pdfSorterWorker.entry.ts", // worker entrypoint: runs only inside a spawned worker
        "src/jobs/runJobEntryPoint.ts", // job process entrypoint: wires argv to a job and exits
      ],
    },
    // Load .env.test from @idaho-th/server (adds basic env-compatibility for direct invocations of vitest)
    env:
      mode === "test"
        ? loadEnv(mode, join(workspaceRoot, "apps/@idaho-th/server"), "")
        : undefined,
  },
}));
