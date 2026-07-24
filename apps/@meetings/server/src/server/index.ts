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

import { registerTaskRoutes } from "~@meetings/server/server/routes";
import { appRouter, createContext } from "~@meetings/trpc";
import { buildCommonServer } from "~server-setup-plugin";

export function buildServer() {
  const domain = process.env["AUTH0_DOMAIN"];
  const audienceEnv = process.env["AUTH0_AUDIENCE"];
  if (!domain || !audienceEnv) {
    throw new Error("Missing required environment variables for Auth0");
  }

  // AUTH0_AUDIENCE may be a semicolon-separated list, in which case the
  // server accepts tokens for any of the listed audiences. This is what makes
  // a zero-downtime audience migration safe: during the transition, set it to
  // both the old and new audience so in-flight tokens and not-yet-updated
  // mobile builds keep validating, then drop the old one once traffic has
  // moved. A single value behaves exactly as before.
  //
  // Semicolon (not comma) because the preview Cloud Run deploy reuses the
  // staging SOPS file and sets env vars via a single
  // `gcloud run deploy --set-env-vars=KEY1=val1,KEY2=val2` CLI string, where a
  // literal comma inside a value is parsed as a new key/value pair.
  const audiences = audienceEnv
    .split(";")
    .map((value) => value.trim())
    .filter(Boolean);
  if (audiences.length === 0) {
    throw new Error("Missing required environment variables for Auth0");
  }

  const server = buildCommonServer({
    appRouter,
    createContext,
    auth0Options: {
      domain,
      audience: audiences,
    },
  });

  registerTaskRoutes(server);

  return server;
}
