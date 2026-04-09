// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

export default defineConfig(({ mode }) => ({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/apps/@jii-texting/processor",
  test: {
    passWithNoTests: true,
    setupFiles: ["src/test/setup/index.ts", "src/setupTests.ts"],
    globals: true,
    cache: { dir: "../../node_modules/.vitest" },
    globalSetup: ["src/setupTestsGlobal.ts"],
    environment: "node",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    // Ensure that tests are run one at a time so that we don't have multiple
    // updates to the test DB at once
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      reportsDirectory: "../../coverage/apps/@jii-texting/processor",
      provider: "v8",
    },
    // Load .env.test from @jii-texting/server (adds basic env-compatibility for direct invocations of vitest)
    env:
      mode === "test"
        ? loadEnv(mode, join(workspaceRoot, "apps/@jii-texting/server"), "")
        : undefined,
  },
  plugins: [nxViteTsPaths()],
}));
