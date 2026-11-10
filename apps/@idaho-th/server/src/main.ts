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

import { buildServer } from "~@idaho-th/server/server";
import { registerShutdownHandlers } from "~@idaho-th/server/server/shutdown";
import { ensureGcsStorageInitialized } from "~@idaho-th/trpc/storage/gcs";

const host = process.env["HOST"] ?? "localhost";
const port = process.env["PORT"] ? Number(process.env["PORT"]) : 3010;

async function start() {
  await ensureGcsStorageInitialized();

  const server = buildServer();

  // Start listening
  server.listen({ port, host }, (err) => {
    if (err) {
      server.log.error(err);
      process.exit(1);
    } else {
      server.log.info(`[ ready ] Idaho TH Server at http://${host}:${port}`);
    }
  });

  // Hot Module replacement support for development
  if (import.meta.hot && process.env["NODE_ENV"] === "development") {
    server.log.info("[hot reload enabled]");

    async function killServer() {
      await server.close();
    }

    import.meta.hot.on("vite:beforeFullReload", () => {
      killServer();
    });

    import.meta.hot.dispose(() => {
      server.log.info("[dispose]");
      killServer();
    });
  } else {
    // Not under HMR: each hot reload re-runs this module, which would stack
    // another set of process signal listeners per reload.
    registerShutdownHandlers(server);
  }
}

void start().catch((error) => {
  console.error(error);
  process.exit(1);
});
