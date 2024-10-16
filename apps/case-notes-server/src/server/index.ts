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

import { createContext } from "~case-notes-server/trpc/context";
import { appRouter } from "~case-notes-server/trpc/router";
import { buildCommonServer } from "~server-setup-plugin";

export function buildServer() {
  if (!process.env["AUTH0_DOMAIN"] || !process.env["AUTH0_AUDIENCE"]) {
    throw new Error("Missing required environment variables for Auth0");
  }

  const server = buildCommonServer({
    appRouter,
    createContext,
    auth0Options: {
      domain: process.env["AUTH0_DOMAIN"],
      audience: process.env["AUTH0_AUDIENCE"],
    },
  });

  return server;
}
