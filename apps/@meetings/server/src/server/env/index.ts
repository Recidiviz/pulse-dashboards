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
  CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL: z
    .string()
    .min(1, "CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL is required"),
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
