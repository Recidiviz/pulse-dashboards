import { router } from "~sentencing-server/trpc/init";
import { caseRouter } from "~sentencing-server/trpc/routes/case/case.router";
import { offenseRouter } from "~sentencing-server/trpc/routes/offense/offense.router";
import { opportunityRouter } from "~sentencing-server/trpc/routes/opportunity/opportunity.router";
import { staffRouter } from "~sentencing-server/trpc/routes/staff/staff.router";

export const appRouter = router({
  staff: staffRouter,
  case: caseRouter,
  opportunity: opportunityRouter,
  offense: offenseRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
