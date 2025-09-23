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

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: "../../../node_modules/.vite/libs/@meetings/trpc",

  plugins: [nxViteTsPaths()],
  test: {
    name: "@meetings/trpc",
    setupFiles: ["__tests__/setup/index.ts"],
    globals: true,
    cache: { dir: "../../../node_modules/.vitest" },
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
    // We need to set this up this way because:
    // 1. The vitest vscode extension doesn't load any environment variables, so it needs backups
    // 2. The env variables for local testing and CI are different
    // NOTE: none of these are true secrets, they are all fine to put in this file
    env: {
      AUTH0_AUDIENCE: process.env["AUTH0_AUDIENCE"] ?? "test",
      AUTH0_DOMAIN: process.env["AUTH0_DOMAIN"] ?? "test",
      DATABASE_URL:
        process.env["DATABASE_URL"] ??
        "postgresql://postgres:postgres@localhost:6507/meetings-test?schema=public",
      DATABASE_URL_US_NE:
        process.env["DATABASE_URL_US_NE"] ??
        "postgresql://postgres:postgres@localhost:6507/meetings-test?schema=public",
      SENTRY_DSN:
        process.env["SENTRY_DSN"] ??
        "https://4237e42b7c1d1964233e3a993f150553@o432474.ingest.us.sentry.io/4509985399373824",
      SENTRY_ENV: process.env["SENTRY_ENV"] ?? "test",
      AUDIO_RECORDINGS_BUCKET_NAME:
        process.env["AUDIO_RECORDINGS_BUCKET_NAME"] ?? "test-audio-bucket",
    },
  },
}));
