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

import { router } from "~@meetings/trpc/init";
import { clientRouter } from "~@meetings/trpc/routes/client/client.router";
import { meetingRouter } from "~@meetings/trpc/routes/meeting/meeting.router";
import { staffRouter } from "~@meetings/trpc/routes/staff/staff.router";

const v1Router = router({
  staff: staffRouter,
  client: clientRouter,
  meeting: meetingRouter,
});

export const appRouter = router({
  v1: v1Router,
});

// export type definition of API
export type AppRouter = typeof appRouter;
