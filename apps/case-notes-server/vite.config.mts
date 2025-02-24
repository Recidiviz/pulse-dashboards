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
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { defineConfig } from "vite";

export default defineConfig({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/apps/case-notes-server",

  plugins: [nxViteTsPaths()],
  test: {
    globals: true,
    cache: { dir: "../../node_modules/.vitest" },
    environment: "node",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "../../coverage/apps/case-notes-server",
      provider: "v8",
    },
    env: {
      AUTH0_DOMAIN: "test",
      AUTH0_AUDIENCE: "test",
      VERTEX_PROJECT_ID: "project-id",
      VERTEX_ENGINE_ID: "engine-id",
      CASE_NOTES_BQ_TABLE_ADDRESS: "bq-table",
      LOGS_BQ_PROJECT_ID: "logs-project-id",
      LOGS_BQ_DATASET_ID: "logs-dataset-id",
      LOGS_BQ_TABLE_ID: "logs-table-id",
      SENTRY_DSN:
        "https://f9d293e9c6d5b26b5393edc64b666052@o432474.ingest.us.sentry.io/4508207193128960",
      SENTRY_ENV: "test",
    },
  },
});
