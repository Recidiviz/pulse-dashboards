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

import { beforeAll, vi } from "vitest";

import { buildCommonServer } from "~server-setup-plugin";
import {
  createContext,
  testRouter,
} from "~server-setup-plugin/test/setup/trpc";

export const testPort = process.env["PORT"]
  ? Number(process.env["PORT"])
  : 3003;
export const testHost = process.env["HOST"] ?? "localhost";

export let testServer: ReturnType<typeof buildCommonServer>;

beforeAll(async () => {
  const testServer = buildCommonServer({
    createContext,
    appRouter: testRouter,
    auth0Options: {
      domain: "test",
      audience: "test",
    },
  });

  // Override he jwtVerify function to always pass
  testServer.addHook("preHandler", (req, reply, done) => {
    req.jwtVerify = vi.fn(async () => {
      return "";
    });
    done();
  });

  // Start listening.
  testServer.listen({ port: testPort, host: testHost }, (err) => {
    if (err) {
      testServer.log.error(err);
      process.exit(1);
    } else {
      console.log(`[ ready ] http://${testHost}:${testPort}`);
    }
  });
});
