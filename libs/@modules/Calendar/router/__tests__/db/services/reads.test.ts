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

import type { CalendarRules } from "~@modules/Calendar/rules";

import type { ResolvedCalendar } from "../../../src/procedures";
import { getMonth } from "../../../src/services/reads";
import { testPrismaClient } from "../../setup";
import { TEST_RULES } from "../../setup/calendarConfig";
import { AUDIT_EMAIL } from "../../setup/fixtures";

/**
 * The engine's reads with a synthetic calendar's rules, for settings no
 * state's API uses today.
 */

async function resolvedTestCalendar(
  rules: CalendarRules,
): Promise<ResolvedCalendar> {
  const row = await testPrismaClient.calendar.findUniqueOrThrow({
    where: { code: "TEST_CALENDAR" },
  });
  await testPrismaClient.calendarMonth.create({
    data: {
      calendarId: row.id,
      year: 2026,
      month: 9,
      createdByEmail: AUDIT_EMAIL,
      updatedByEmail: AUDIT_EMAIL,
    },
  });
  return {
    id: row.id,
    stateCode: "US_CO",
    code: row.code,
    name: row.name,
    rules,
    kinds: [],
  };
}

function withRegion(holidayRegion: string | null): CalendarRules {
  return {
    ...TEST_RULES,
    settings: { ...TEST_RULES.settings, holidayRegion },
  };
}

describe("getMonth", () => {
  it("has no holidays when the calendar's settings have no holiday region", async () => {
    const calendar = await resolvedTestCalendar(withRegion(null));

    const detail = await getMonth(testPrismaClient, calendar, {
      year: 2026,
      month: 9,
    });

    expect(detail?.holidays).toEqual([]);
  });

  it("is INTERNAL_SERVER_ERROR when no holiday source covers the region", async () => {
    const calendar = await resolvedTestCalendar(withRegion("US-ZZ"));

    await expect(
      getMonth(testPrismaClient, calendar, { year: 2026, month: 9 }),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
});
