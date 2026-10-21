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

import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: "../../../../node_modules/.vite/libs/@modules/Calendar/rules",

  plugins: [tsconfigPaths()],

  test: {
    // No globalSetup that pins TZ to UTC, so running the tests under another TZ
    // checks that the date math ignores the host time zone.
    passWithNoTests: true,
    mockReset: true,
    unstubEnvs: true,
    setupFiles: ["src/setupTests.ts"],
    name: "@modules/Calendar/rules",
    watch: false,
    globals: true,
    environment: "node",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "../../../../coverage/libs/@modules/Calendar/rules",
      provider: "v8",
    },
  },
}));
