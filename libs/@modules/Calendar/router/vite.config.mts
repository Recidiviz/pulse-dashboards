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

import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { configDefaults, defineConfig } from "vitest/config";

/**
 * The Calendar test database from libs/@modules/Calendar/prisma/compose.yml
 * (nx local-dbs @modules/Calendar/prisma). CALENDAR_TEST_DATABASE_URL
 * overrides it, so CI can point the tests at its own Postgres. The tests set
 * CALENDAR__US_CO_DATABASE_URL, the variable getPrismaClient reads, from these
 * and never from the shell, because they truncate the Calendar tables and a
 * shell with the dev env loaded points that variable at the dev database.
 */
const LOCAL_TEST_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:6563/module-Calendar-test";

export default defineConfig(({ mode }) => {
  // "nx test-db" runs vitest in db mode, which runs only the tests that need
  // a database. Plain "nx test" runs the rest, so CI's general test job,
  // which has no Postgres, never runs them.
  const isDbMode = mode === "db";

  return {
    root: __dirname,
    cacheDir: "../../../../node_modules/.vite/libs/@modules/Calendar/router",
    plugins: [nxViteTsPaths(), nxCopyAssetsPlugin(["*.md"])],
    test: {
      mockReset: true,
      unstubEnvs: true,
      globalSetup: ["src/setupTestsGlobal.ts"],
      setupFiles: ["src/setupTests.ts"],
      passWithNoTests: true,
      name: "@modules/Calendar/router",
      watch: false,
      globals: true,
      environment: "node",
      include: isDbMode
        ? ["__tests__/db/**/*.test.ts"]
        : [
            "{src,tests,__tests__}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
          ],
      exclude: isDbMode
        ? configDefaults.exclude
        : [...configDefaults.exclude, "__tests__/db/**"],
      // The database tests share one database and reset it before each test.
      fileParallelism: !isDbMode,
      env: isDbMode
        ? {
            CALENDAR__US_CO_DATABASE_URL:
              process.env["CALENDAR_TEST_DATABASE_URL"] ??
              LOCAL_TEST_DATABASE_URL,
          }
        : {},
      reporters: ["default"],
      coverage: {
        reportsDirectory: "../../../../coverage/libs/@modules/Calendar/router",
        provider: "v8" as const,
      },
    },
  };
});
