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
  EXPO_PUBLIC_AUTH0_AUDIENCE: z
    .string()
    .min(1, "EXPO_PUBLIC_AUTH0_AUDIENCE is required"),
  EXPO_PUBLIC_AUTH0_CLIENT_ID: z
    .string()
    .min(1, "EXPO_PUBLIC_AUTH0_CLIENT_ID is required"),
  EXPO_PUBLIC_AUTH0_DOMAIN: z
    .string()
    .min(1, "EXPO_PUBLIC_AUTH0_DOMAIN is required"),
  EXPO_PUBLIC_OFFLINE_MODE: z.coerce.boolean().default(false),
  EXPO_PUBLIC_SENTRY_DSN: z
    .string()
    .min(1, "EXPO_PUBLIC_SENTRY_DSN is required"),
  EXPO_PUBLIC_SERVER_URL: z.string().default("http://localhost:3002"),
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
