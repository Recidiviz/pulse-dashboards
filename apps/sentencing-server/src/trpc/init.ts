import { trpcMiddleware } from "@sentry/node";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import { createContext } from "~sentencing-server/trpc/context";

export const t = initTRPC
  .context<typeof createContext>()
  // Required to get Date objects to serialize correctly.
  .create({ transformer: superjson });

export const router = t.router;

/*
 * Base procedure that:
 * - Attaches the RPC input to the context so that sentry can log it
 * - Checks if the request is authorized by Auth0
 */
export const baseProcedure = t.procedure
  .use(async (opts) => {
    trpcMiddleware({
      attachRpcInput: true,
    });

    return opts.next();
  })
  .use(async (opts) => {
    const { ctx } = opts;
    if (!ctx.auth0Authorized) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return opts.next();
  });
