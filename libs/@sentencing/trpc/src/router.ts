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

import { router } from "~@sentencing/trpc/init";
import { caseRouter } from "~@sentencing/trpc/routes/case/case.router";
import { countyRouter } from "~@sentencing/trpc/routes/county/county.router";
import { insightRouter } from "~@sentencing/trpc/routes/insight/insight.router";
import { offenseRouter } from "~@sentencing/trpc/routes/offense/offense.router";
import { opportunityRouter } from "~@sentencing/trpc/routes/opportunity/opportunity.router";
import { staffRouter } from "~@sentencing/trpc/routes/staff/staff.router";
import { supervisorRouter } from "~@sentencing/trpc/routes/supervisor/supervisor.router";

export const appRouter = router({
  staff: staffRouter,
  supervisor: supervisorRouter,
  case: caseRouter,
  opportunity: opportunityRouter,
  offense: offenseRouter,
  county: countyRouter,
  insight: insightRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
