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

import type { FastifyInstance } from "fastify";
import type { ViteHotContext } from "vite/types/hot.js";

export type StartServerOptions = {
  // Port to listen on when the environment does not set PORT.
  defaultPort: number;
  // The entrypoint's own import.meta.hot, which is undefined outside a vite-node dev server.
  hot: ViteHotContext | undefined;
};

/**
 * Starts the server listening on PORT, falling back to defaultPort, and shuts it down again
 * before vite-node hot-reloads the entrypoint in development.
 *
 * Pass the entrypoint's own import.meta.hot as hot because vite-node keys
 * dispose callbacks by the module that registers them; we want that to be
 * the module that owns the restarting server, not this one.
 */
export function startServer(
  server: FastifyInstance,
  { defaultPort, hot }: StartServerOptions,
) {
  const host = process.env["HOST"] ?? "localhost";
  const port = process.env["PORT"] ? Number(process.env["PORT"]) : defaultPort;

  server.listen({ port, host }, (err) => {
    if (err) {
      server.log.error(err);
      process.exit(1);
    } else {
      console.log(`[ ready ] http://${host}:${port}`);
    }
  });

  if (hot && process.env["NODE_ENV"] === "development") {
    // important to return the close() promise here
    // for Vite to await before reloading; server restart may fail
    // due to port contention otherwise
    const closeServer = () => server.close();

    hot.on("vite:beforeFullReload", closeServer);
    hot.dispose(closeServer);
  }
}
