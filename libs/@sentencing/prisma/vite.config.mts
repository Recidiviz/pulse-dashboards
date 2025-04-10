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
  cacheDir: "../../../node_modules/.vite/libs/@sentencing/prisma",

  plugins: [nxViteTsPaths()],
  test: {
    name: "@sentencing/prisma",
    globals: true,
    cache: { dir: "../../../node_modules/.vitest" },
    environment: "node",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "../../../coverage/libs/@sentencing/prisma",
      provider: "v8",
    },
    // We need to set this up this way because:
    // 1. The vitest vscode extension doesn't load any environment variables, so it needs backups
    // 2. The env variables for local testing and CI are different
    // NOTE: none of these are true secrets, they are all fine to put in this file
    env: {
      AUTH0_AUDIENCE: process.env["AUTH0_AUDIENCE"] ?? "test",
      AUTH0_DOMAIN: process.env["AUTH0_DOMAIN"] ?? "test",
      CLOUD_STORAGE_NOTIFICATION_IAM_EMAIL:
        process.env["CLOUD_STORAGE_NOTIFICATION_IAM_EMAIL"] ??
        "test-csn@fake.com",
      DATABASE_URL:
        process.env["DATABASE_URL"] ??
        "postgresql://postgres:postgres@localhost:6501/sentencing-test?schema=public",
      DATABASE_URL_US_ID:
        process.env["DATABASE_URL_US_ID"] ??
        "postgresql://postgres:postgres@localhost:6501/sentencing-test?schema=public",
      IMPORT_BUCKET_ID: process.env["IMPORT_BUCKET_ID"] ?? "test-bucket",
      IMPORT_CLOUD_TASK_LOCATION:
        process.env["IMPORT_CLOUD_TASK_LOCATION"] ?? "test-task-location",
      IMPORT_CLOUD_TASK_PROJECT:
        process.env["IMPORT_CLOUD_TASK_PROJECT"] ?? "test-task-project",
      IMPORT_CLOUD_TASK_QUEUE:
        process.env["IMPORT_CLOUD_TASK_QUEUE"] ?? "test-task-queue",
      IMPORT_CLOUD_TASK_SERVICE_ACCOUNT_EMAIL:
        process.env["IMPORT_CLOUD_TASK_SERVICE_ACCOUNT_EMAIL"] ??
        "test-task@fake.com",
      IMPORT_CLOUD_TASK_URL:
        process.env["IMPORT_CLOUD_TASK_URL"] ?? "test-task-url",
      SENTRY_DSN:
        process.env["SENTRY_DSN"] ??
        "https://4dfb7cc349417f57a791991bfd3173f5@o432474.ingest.us.sentry.io/4507227545010176",
      SENTRY_ENV: process.env["SENTRY_ENV"] ?? "test",
    },
  },
});
