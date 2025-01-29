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

// Include Prisma in the built bundle even though it is not used (yet)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as Prisma from "@prisma/client";
import Fastify from "fastify";
const host = process.env["HOST"] ?? "localhost";
const port = process.env["PORT"] ? Number(process.env["PORT"]) : 3000;

// Instantiate Fastify with some config
const server = Fastify({
  logger: true,
});

server.get("/", async function handler() {
  return { hello: "world" };
});

// Start listening.
server.listen({ port, host }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  } else {
    console.log(`[ ready ] http://${host}:${port}`);
  }
});

export default server;
