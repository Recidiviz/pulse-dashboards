import { router } from "~sentencing-server/trpc/init";
import { caseRouter } from "~sentencing-server/trpc/routes/case/case.router";
import { staffRouter } from "~sentencing-server/trpc/routes/staff/staff.router";

export const appRouter = router({
  staff: staffRouter,
  case: caseRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
