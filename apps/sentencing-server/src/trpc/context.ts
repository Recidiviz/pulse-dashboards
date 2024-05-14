import { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";

import { client } from "../prisma";

export function createContext({ req, res }: CreateFastifyContextOptions) {
  return { req, res, prisma: client };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
