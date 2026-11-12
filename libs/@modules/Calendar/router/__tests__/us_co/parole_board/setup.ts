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

import type { CalendarConfig } from "~@modules/Calendar/rules";
import {
  US_CO_PAROLE_BOARD,
  US_CO_PAROLE_BOARD_RULES,
  US_CO_REFERENCE_DATA,
} from "~@modules/Calendar/rules/us_co/parole_board";
import { router } from "~@modules-server/trpc-base";

import type { ResolvedCalendar } from "../../../src/procedures";
import { usCoPublicCalendarRouter } from "../../../src/us_co/parole_board";
import { initFastifyAndSetUser, testPrismaClient } from "../../setup";
import { AUDIT_EMAIL } from "../../setup/fixtures";

/**
 * The harness for Colorado's API: it mounts the router at
 * Calendar.usCo.paroleBoard, as the Modules server does, and inserts
 * US_CO's PAROLE_BOARD_PUBLIC Calendar row before each test, after the generic
 * setup empties the tables and inserts its calendars. The isolation tests use
 * the generic setup's OTHER_CALENDAR_CODE row as another calendar.
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

/**
 * Synthetic rows in the shape Colorado's code expects: its three entry kinds,
 * two made-up sites and a pattern for each kind. None of it is Colorado's
 * reference data.
 */
export const US_CO_TEST_CONFIG: Omit<CalendarConfig, "calendar"> = {
  resourceTypes: [{ code: "SITE", label: "Site", sortOrder: 1 }],
  resources: [
    {
      code: "SITE_A",
      typeCode: "SITE",
      label: "Site A",
      name: "Site A full name",
      sortOrder: 10,
      isActive: true,
    },
    {
      code: "SITE_B",
      typeCode: "SITE",
      label: "Site B",
      name: null,
      sortOrder: 20,
      isActive: true,
    },
  ],
  kinds: [
    { code: "HEARING", label: "Hearing", sortOrder: 1 },
    { code: "FULL_BOARD", label: "Full Board", sortOrder: 2 },
    { code: "BUSINESS_MEETING", label: "Business Mtg", sortOrder: 3 },
  ],
  patterns: [
    {
      kindCode: "HEARING",
      resourceCode: "SITE_A",
      rules: [{ type: "weekOfMonth", week: 1, weekday: "MONDAY" }],
      startTime: "08:00",
      endTime: null,
    },
    {
      kindCode: "HEARING",
      resourceCode: "SITE_B",
      rules: [{ type: "weekOfMonth", week: 2, weekday: "TUESDAY" }],
      startTime: "09:30",
      endTime: null,
    },
    {
      kindCode: "FULL_BOARD",
      resourceCode: null,
      rules: [{ type: "everyWeekday", weekday: "FRIDAY" }],
      startTime: null,
      endTime: null,
    },
    {
      kindCode: "BUSINESS_MEETING",
      resourceCode: null,
      rules: [{ type: "weekOfMonth", week: 3, weekday: "FRIDAY" }],
      startTime: null,
      endTime: null,
    },
  ],
};

/**
 * The id of the PAROLE_BOARD_PUBLIC row, or of the row with another code, such
 * as OTHER_CALENDAR_CODE.
 */
export async function paroleBoardCalendarId(
  code: string = US_CO_PAROLE_BOARD.code,
): Promise<string> {
  const { id } = await testPrismaClient.calendar.findUniqueOrThrow({
    where: { code },
  });
  return id;
}

/**
 * The PAROLE_BOARD_PUBLIC row, or the row with another code, resolved with
 * Colorado's rules as Colorado's editor procedure resolves it, for a test that
 * calls the engine directly, such as one that sets up another calendar's
 * month.
 */
export async function resolveParoleBoardCalendar(
  code: string = US_CO_PAROLE_BOARD.code,
): Promise<ResolvedCalendar> {
  const row = await testPrismaClient.calendar.findUniqueOrThrow({
    where: { code },
    include: { kinds: { orderBy: { sortOrder: "asc" } } },
  });
  return {
    id: row.id,
    stateCode: US_CO_PAROLE_BOARD.stateCode,
    code: row.code,
    name: row.name,
    rules: US_CO_PAROLE_BOARD_RULES,
    kinds: row.kinds.flatMap((kind) =>
      US_CO_PAROLE_BOARD_RULES.entryTypes
        .filter((type) => type.code === kind.code)
        .map((type) => ({ ...kind, ...type })),
    ),
  };
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
