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

import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/libs/firestore-config",

  plugins: [nxViteTsPaths()],

  // for the unit tests we have to force Vitest to use the CommonJS version of the library,
  // because the unit test SDK bindings are outdated;
  // see https://github.com/firebase/firebase-js-sdk/issues/6080#issuecomment-1155058810
  resolve: {
    alias: process.env["VITEST"]
      ? [
          {
            find: /^@firebase\/firestore$/,
            replacement: path.join(
              __dirname,
              `../../node_modules/@firebase/firestore/dist/index.node.cjs.js`,
            ),
          },
        ]
      : [],
  },

  test: {
    mockReset: true,
    unstubEnvs: true,
    globalSetup: ["src/setupTestsGlobal.ts"],
    setupFiles: ["src/setupTests.ts"],
    globals: true,
    environment: "node",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "../../coverage/libs/firestore-config",
      provider: "v8",
    },
  },
});
