// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { mergeRouters, router } from "../procedures/init";
import { authRouter } from "./routes/auth/router";
import { staffRouter } from "./routes/staff/router";
import { stateRouter } from "./routes/state/router";
import { userRouter } from "./routes/user/router";

// routes are divided up by intended client to make the types more useful,
// but in the end there is just one router on this server that handles both
const opportunitiesRoutes = router({
  auth: authRouter,
  state: stateRouter,
  user: userRouter,
});
export type OpportunitiesRoutes = typeof opportunitiesRoutes;
const staffRoutes = router({
  staff: staffRouter,
});
export type StaffRoutes = typeof staffRoutes;

export const appRouter = mergeRouters(opportunitiesRoutes, staffRoutes);
