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
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { defineConfig } from "vite";

export default defineConfig({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/apps/@jii-texting/processor",

  plugins: [nxViteTsPaths()],
  test: {
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
    // We need to set this up this way because:
    // 1. The vitest vscode extension doesn't load any environment variables, so it needs backups
    // 2. The env variables for local testing and CI are different
    // NOTE: none of these are true secrets, they are all fine to put in this file
    env: {
      DATABASE_URL:
        process.env["DATABASE_URL"] ??
        "postgresql://postgres:postgres@localhost:6503/jii-texting-test?schema=public",
      DATABASE_URL_US_ID:
        process.env["DATABASE_URL_US_ID"] ??
        "postgresql://postgres:postgres@localhost:6503/jii-texting-test?schema=public",
    },
  },
});
