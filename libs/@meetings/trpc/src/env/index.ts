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

import { z } from "zod";

const envSchema = z.object({
  AUDIO_RECORDINGS_BUCKET_NAME: z
    .string()
    .min(1, "AUDIO_RECORDINGS_BUCKET_NAME is required"),
  CLOUD_TASKS_PROJECT: z.string().min(1, "CLOUD_TASKS_PROJECT is required"),
  CLOUD_TASKS_LOCATION: z.string().min(1, "CLOUD_TASKS_LOCATION is required"),
  CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL: z
    .string()
    .min(1, "CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL is required"),
  STITCHING_TASK_QUEUE_NAME: z
    .string()
    .min(1, "STITCHING_TASK_QUEUE_NAME is required"),
  STITCHING_TASK_REQUEST_URL: z
    .string()
    .min(1, "STITCHING_TASK_REQUEST_URL is required"),
  NODE_ENV: z.string().min(1, "NODE_ENV is required"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "Environment variable validation failed:",
    parsedEnv.error.format(),
  );
  process.exit(1); // Terminate the application
}

export default parsedEnv.data;
