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

export default defineConfig(({mode}) =>
  ({
    root: __dirname,
    cacheDir: "../../../node_modules/.vite/libs/@meetings/prisma",

    plugins: [nxViteTsPaths()],
    test: {
      passWithNoTests: true,
      name: "@meetings/prisma",
      globals: true,
      cache: {dir: "../../../node_modules/.vitest"},
      environment: "node",
      include: ["__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
      reporters: ["default"],
      coverage: {
        reportsDirectory: "../../../coverage/libs/@meetings/prisma",
        provider: "v8",
      },
      // Load .env.test from @meetings/server (adds basic env-compatibility for direct invocations of vitest)
      env: mode === "test" ? loadEnv(mode, join(workspaceRoot, "apps/@meetings/server"), "") : undefined,
    }
  }));
