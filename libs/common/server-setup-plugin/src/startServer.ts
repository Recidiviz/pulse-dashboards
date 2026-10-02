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

export type StartServerOptions = {
  /** Port to listen on when the environment does not set PORT. */
  defaultPort: number;
};

/**
 * Starts the server listening on PORT, falling back to defaultPort, and under hot
 * reload closes whichever instance a previous execution of the entrypoint left behind.
 */
export async function startServer(
  server: FastifyInstance,
  { defaultPort }: StartServerOptions,
) {
  const host = process.env["HOST"] ?? "localhost";
  const port = process.env["PORT"] ? Number(process.env["PORT"]) : defaultPort;

  // dependent projects may not include Vite types, where hot is declared;
  // falling back to false when it doesn't exist should safely do nothing
  const isHMRActive =
    !!(import.meta as ImportMeta & { hot: unknown }).hot &&
    // hot should never exist outside of dev, but let's make extra sure this is a dev-only behavior
    process.env["NODE_ENV"] === "development";

  // this condition should hit deployment builds, miss local dev runs
  if (!isHMRActive) {
    try {
      await server.listen({ port, host });
      console.log(`[ ready ] http://${host}:${port}`);
    } catch (e) {
      server.log.error(e);
      process.exit(1);
    }
    return;
  }

  // If we've gotten this far, vite-node hot reloading is active
  // and we have to manage our Fastify dev server to be compatible with it.
  // We use global state for this so it doesn't get cleared along with the module cache
  const globalDevState = globalThis as typeof globalThis & {
    // these don't come from vite-node, they're just arbitrary properties that we control
    __devServer?: FastifyInstance;
    __devServerStartup?: Promise<void>;
  };

  // Chaining onto the previous startup serializes overlapping reloads, which
  // vite-node does not do for us. This prevents both processes from trying to
  // bind the same port, which will crash the dev server and require a manual restart
  globalDevState.__devServerStartup = (
    globalDevState.__devServerStartup ?? Promise.resolve()
  )
    .then(async () => {
      const outgoing = globalDevState.__devServer;
      globalDevState.__devServer = server;

      if (outgoing) {
        try {
          await outgoing.close();
        } catch (e) {
          // this may or may not be a fatal error, which is why we don't throw here;
          // it's possible that the server has already stopped listening, or never started
          server.log.error(e, "could not close the outgoing server");
        }
      }

      await server.listen({ port, host });
      console.log(`[ ready ] http://${host}:${port}`);
    })
    // a failed start does not take the process down; the next reload gets another try
    .catch((e) => server.log.error(e));

  await globalDevState.__devServerStartup;
}
