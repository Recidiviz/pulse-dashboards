import { router } from "~sentencing-server/trpc/init";
import { caseRouter } from "~sentencing-server/trpc/routes/case/case.router";
import { opportunityRouter } from "~sentencing-server/trpc/routes/opportunity/opportunity.router";
import { staffRouter } from "~sentencing-server/trpc/routes/staff/staff.router";

export const appRouter = router({
  staff: staffRouter,
  case: caseRouter,
  opportunity: opportunityRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
