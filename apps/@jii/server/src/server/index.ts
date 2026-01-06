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

import { appRouter, createContext } from "~@jii/trpc";
import { buildCommonServer } from "~server-setup-plugin";

export function buildServer() {
  let firebaseAuthOptions;

  if (process.env["IS_OFFLINE"] !== "true") {
    // this is not the current project, it is the backend shared with staff app for auth and Firestore
    const firebaseBackendProject = process.env["FIREBASE_BACKEND_PROJECT"];

    if (!firebaseBackendProject) {
      throw new Error("Missing required Firebase configuration");
    }

    firebaseAuthOptions = {
      projectId: firebaseBackendProject,
    };
  }

  const server = buildCommonServer({
    appRouter,
    createContext,
    // the extra path segment lets us namespace the server in the frontend proxy config
    trpcPrefix: "/api/trpc",
    firebaseAuthOptions,
  });

  return server;
}
