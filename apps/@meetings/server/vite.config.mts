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
  cacheDir: "../../../node_modules/.vite/apps/@meetings/server",

  plugins: [nxViteTsPaths()],
  test: {
    name: "@meetings/server",
    setupFiles: ["__tests__/setup/index.ts"],
    globals: true,
    cache: { dir: "../../node_modules/.vitest" },
    environment: "node",
    include: ["__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      reportsDirectory: "../../../coverage/apps/@meetings/server",
      provider: "v8",
    },
    clearMocks: true,
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
      CLOUD_TASKS_PROJECT: process.env["CLOUD_TASKS_PROJECT"] ?? "test-project",
      CLOUD_TASKS_LOCATION:
        process.env["CLOUD_TASKS_LOCATION"] ?? "us-central1",
      CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL:
        process.env["CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL"] ??
        "test-service-account-email@test-project.iam.gserviceaccount.com",
      STITCHING_TASK_QUEUE_NAME:
        process.env["STITCHING_TASK_QUEUE_NAME"] ?? "test-stitching-task-queue",
      STITCHING_TASK_REQUEST_URL:
        process.env["STITCHING_TASK_REQUEST_URL"] ??
        "https://test-server.app/stitch-audio",
      NODE_ENV: process.env["NODE_ENV"] ?? "production",
      ASSEMBLYAI_API_KEY: process.env["ASSEMBLYAI_API_KEY"] ?? "noop",
      DEEPGRAM_API_KEY: process.env["DEEPGRAM_API_KEY"] ?? "noop",
      TRANSCRIPTION_TASK_QUEUE_NAME:
        process.env["TRANSCRIPTION_TASK_QUEUE_NAME"] ??
        "transcription-task-queue",
      TRANSCRIPTION_TASK_REQUEST_URL:
        process.env["TRANSCRIPTION_TASK_REQUEST_URL"] ??
        "https://test-server.app/transcribe-audio",
    },
  },
}));
