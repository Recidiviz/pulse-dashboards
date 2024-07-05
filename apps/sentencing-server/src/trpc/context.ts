// Required to get the "request.jwtVerify" decorator to be recongized by typescript
import "@fastify/jwt";

import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";

import { prismaClient } from "~sentencing-server/prisma";

export async function createContext({ req, res }: CreateFastifyContextOptions) {
  let auth0Authorized;

  // Check if the request is authorized by Auth0
  try {
    if (req.headers.authorization) {
      // Auth is set up in server/index.ts with fastifyAuth0Verify, which uses @fastify/jwt
      // under the hood and exposes this decorator
      await req.jwtVerify();
      auth0Authorized = true;
    } else {
      auth0Authorized = false;
    }
  } catch (err) {
    auth0Authorized = false;
  }

  return { req, res, prisma: prismaClient, auth0Authorized };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
