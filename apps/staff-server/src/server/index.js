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

import http from "http";

import { app, port } from "./app";
import { initTypesenseScopedKeys } from "./workflows/typesense/init";

export const server = http.createServer(app);

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`;

  console.log(`Listening on ${bind}`);
}

server.listen(port, () => console.log(`Server listening on port ${port}`));
server.on("error", onError);
server.on("listening", onListening);

// Prep the search-only parent key in the background. The mint endpoint (the
// only consumer) is under active development and gated separately, so a
// startup failure here should NOT block Pathways/Lantern/Workflows routes from
// serving. The mint endpoints return a 500 with a clear message until this
// resolves — see mintCaseloadScopedKey. Revisit before Typesense-backed
// search ships to production.
initTypesenseScopedKeys().catch((err) => {
  console.error(
    "Typesense scoped-key init failed — /workflows/caseload-scoped-key will 500 until this is fixed:",
    err,
  );
});
