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

import { workspaceRoot } from "@nx/devkit";
import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { join } from "path";
import { defineConfig, loadEnv } from "vite";
import { coverageConfigDefaults } from "vitest/config";

export default defineConfig(({ mode }) => ({
  root: __dirname,
  cacheDir: "../../../node_modules/.vite/libs/@idaho-th/trpc",
  plugins: [nxViteTsPaths(), nxCopyAssetsPlugin(["*.md"])],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  test: {
    // DB-backed tests pay a ~200ms resetDb floor before doing any work of their
    // own; the 5s default left no headroom on a loaded 4-CPU CI runner, and a
    // timed-out test leaves its query in flight to deadlock the next reset.
    testTimeout: 15_000,
    hookTimeout: 15_000,
    mockReset: true,
    unstubEnvs: true,
    globalSetup: ["src/setupTestsGlobal.ts"],
    // env defaults first: importing appRouter reads env at module load.
    setupFiles: [
      "src/test/setup/env.ts",
      "src/setupTests.ts",
      "src/test/setup/index.ts",
    ],
    passWithNoTests: true,
    name: "@idaho-th/trpc",
    watch: false,
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    // Tests share one Postgres instance (see src/test/setup) and must run serially.
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      reportsDirectory: "../../../coverage/libs/@idaho-th/trpc",
      provider: "v8" as const,
      reporter: ["text", "html", "json-summary", "json"],
      // Spread the defaults first: supplying `exclude` replaces them, which
      // would pull every *.test.ts and __tests__/ file into the measurement.
      // The additions are not production code — test helpers credit
      // themselves, barrels only re-export, type-only modules measure
      // nothing, and verify/ is a standalone dev utility nothing imports.
      // pdfSorter/image/** is deliberately NOT excluded: detection/detectPage
      // imports it, so it is production code and has its own suite.
      exclude: [
        ...coverageConfigDefaults.exclude,
        "src/test/**",
        "src/setupTests*.ts",
        "**/index.ts",
        "**/*.types.ts",
        "src/pdfSorter/verify/**",
        "**/*.d.ts",
        "src/pdfSorter/ocr/tesseract.ts", // shells out to the tesseract binary; vi.mock cannot intercept node:child_process
        "src/pdfSorter/worker/pdfSorterWorker.ts", // worker entrypoint: runs only inside a spawned worker
      ],
      thresholds: {
        statements: 90,
        functions: 90,
        branches: 88,
      },
    },
    // Load .env.test from @idaho-th/server (adds basic env-compatibility for direct invocations of vitest)
    env:
      mode === "test"
        ? loadEnv(mode, join(workspaceRoot, "apps/@idaho-th/server"), "")
        : undefined,
  },
}));
