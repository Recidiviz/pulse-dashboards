import { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";

import { prismaClient } from "~sentencing-server/prisma";

export function createContext({ req, res }: CreateFastifyContextOptions) {
  return { req, res, prisma: prismaClient };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
