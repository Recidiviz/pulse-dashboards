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
import {workspaceRoot} from "@nx/devkit";
import {nxViteTsPaths} from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import {join} from "path";
import {defineConfig, loadEnv} from "vite";

export default defineConfig(({mode}) => ({
  root: __dirname,
  cacheDir: "../../../node_modules/.vite/libs/@meetings/trpc",

  plugins: [nxViteTsPaths()],
  test: {
    passWithNoTests: true,
    name: "@meetings/trpc",
    setupFiles: ["__tests__/setup/index.ts"],
    globals: true,
    cache: {dir: "../../../node_modules/.vitest"},
    environment: "node",
    include: ["__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    // We only need to fake out the Date object for our tests.
    // There is a known issue with Vitest and faking out everything: https://github.com/vitest-dev/vitest/issues/7790
    fakeTimers: {
      toFake: ["Date"],
    },
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      reportsDirectory: "../../../coverage/libs/@meetings/trpc",
      provider: "v8",
    },
    // Load .env.test from @meetings/server (adds basic env-compatibility for direct invocations of vitest)
    env: mode === "test" ? loadEnv(mode, join(workspaceRoot, "apps/@meetings/server"), "") : undefined,
  },
}));
