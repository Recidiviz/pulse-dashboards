// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import type { TRPCClient } from "@trpc/client";

import {
  US_CO_PAROLE_BOARD,
  US_CO_REFERENCE_DATA,
} from "~@modules/Calendar/rules/us_co/parole_board";
import { router } from "~@modules-server/trpc-base";

import { usCoPublicCalendarRouter } from "../../../src/us_co/parole_board";
import { initFastifyAndSetUser, testPrismaClient } from "../../setup";
import { AUDIT_EMAIL } from "../../setup/fixtures";

/**
 * The harness for Colorado's API: it mounts the router as Calendar,
 * and inserts US_CO's PAROLE_BOARD_PUBLIC Calendar row before each test, after
 * the generic setup empties the tables.
 */

export const usCoTestRouter = router({
  Calendar: router({ usCo: router({ paroleBoard: usCoPublicCalendarRouter }) }),
});

export let testTRPCClient: TRPCClient<typeof usCoTestRouter>;

/** Starts the server for user and points testTRPCClient at it. */
export async function initUsCoClient(
  user: Parameters<typeof initFastifyAndSetUser>[0],
  options: Omit<
    Parameters<typeof initFastifyAndSetUser<typeof usCoTestRouter>>[1],
    "router"
  > = {},
): Promise<TRPCClient<typeof usCoTestRouter>> {
  testTRPCClient = await initFastifyAndSetUser(user, {
    ...options,
    router: usCoTestRouter,
  });
  return testTRPCClient;
}

beforeEach(async () => {
  await testPrismaClient.calendar.create({
    data: {
      code: US_CO_PAROLE_BOARD.code,
      name: US_CO_REFERENCE_DATA.calendar.name,
      createdByEmail: AUDIT_EMAIL,
      updatedByEmail: AUDIT_EMAIL,
    },
  });
});
