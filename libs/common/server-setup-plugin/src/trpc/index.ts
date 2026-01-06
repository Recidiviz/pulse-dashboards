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

import { trpcMiddleware } from "@sentry/node";
import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { VerifierAsync } from "fast-jwt";

export async function verifyAuth0Token(opts: CreateFastifyContextOptions) {
  const { req } = opts;

  // Check if the request is authorized by Auth0
  try {
    if (req.headers.authorization) {
      // Auth is set up in index.ts with fastifyAuth0Verify, which uses @fastify/jwt
      // under the hood and exposes this decorator
      await req.jwtVerify();
      return req.user;
    } else {
      return undefined;
    }
  } catch {
    return undefined;
  }
}

export async function verifyRegularJwtToken(
  opts: CreateFastifyContextOptions,
  verifier?: typeof VerifierAsync,
) {
  const { req, info } = opts;

  try {
    if (info.connectionParams) {
      // Websocket connection
      let token = info.connectionParams?.["authorization"];

      token = token?.replace(/^Bearer\s+/, "");

      if (!token) {
        throw new Error("No token provided in WebSocket connection");
      }

      if (!verifier) {
        throw new Error(
          "No JWT verifier provided. Cannot verify subscription token.",
        );
      }
      return await verifier(token);
    } else {
      // HTTP connection
      if (!req.headers.authorization) {
        throw new Error("No token provided in HTTP request");
      }

      // This is is a different namespace so it doesn't potentially conflict with the regular JWT verification
      await req.regularJwtVerify();
      return req.user;
    }
  } catch (err) {
    console.error("There was an issue verifying the JWT token:", err);
    return undefined;
  }
}

export function procedurePlugin() {
  const t = initTRPC.context().create();

  return t.procedure.use(
    trpcMiddleware({
      attachRpcInput: true,
    }),
  );
}

export async function verifyFirebaseIdToken(opts: CreateFastifyContextOptions) {
  const { req } = opts;

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    throw new TRPCError({ code: "BAD_REQUEST" });
  }

  // offline mode only runs locally so we don't bother with JWT encoding
  if (process.env["IS_OFFLINE"] === "true") {
    return JSON.parse(token);
  }

  return req.server.firebaseAuth.verifyIdToken(token);
}
