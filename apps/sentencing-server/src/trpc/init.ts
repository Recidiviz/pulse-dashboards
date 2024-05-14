import { trpcMiddleware } from "@sentry/node";
import { initTRPC } from "@trpc/server";

import { createContext } from "~sentencing-server/trpc/context";

export const t = initTRPC.context<typeof createContext>().create();

export const router = t.router;

export const sentryProcedure = t.procedure.use(async (opts) => {
  trpcMiddleware({
    attachRpcInput: true,
  });

  return opts.next();
});
