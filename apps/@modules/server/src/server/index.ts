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

import { appRouter, createContext } from "~@modules-server/trpc";
import { buildCommonServer } from "~server-setup-plugin";

export function buildServer() {
  const domain = process.env["AUTH0_DOMAIN"];
  const audienceEnv = process.env["AUTH0_AUDIENCE"];
  if (!domain || !audienceEnv) {
    throw new Error("Missing required environment variables for Auth0");
  }

  // AUTH0_AUDIENCE list multiple audiences separated by a semicolon
  // Used for zero-downtime audience migration
  const audiences = audienceEnv
    .split(";")
    .map((value) => value.trim())
    .filter(Boolean);

  const server = buildCommonServer({
    appRouter,
    createContext,
    auth0Options: {
      domain,
      audience: audiences,
    },
  });

  return server;
}
