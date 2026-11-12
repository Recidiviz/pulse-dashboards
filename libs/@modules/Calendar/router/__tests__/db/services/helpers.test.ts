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

import { findPublishedMonths } from "../../../src/services/helpers";
import { testPrismaClient } from "../../setup";
import { AUDIT_EMAIL, OTHER_CALENDAR_CODE } from "../../setup/fixtures";

const audit = { createdByEmail: AUDIT_EMAIL, updatedByEmail: AUDIT_EMAIL };

describe("findPublishedMonths", () => {
  let calendarId: string;

  beforeEach(async () => {
    const row = await testPrismaClient.calendar.findUniqueOrThrow({
      where: {
        code: "TEST_CALENDAR",
      },
    });
    calendarId = row.id;
  });

  function month(
    year: number,
    m: number,
    status: "DRAFT" | "PUBLISHED" = "PUBLISHED",
    monthCalendarId = calendarId,
  ) {
    return testPrismaClient.calendarMonth.create({
      data: { calendarId: monthCalendarId, year, month: m, status, ...audit },
    });
  }

  async function published() {
    const months = await findPublishedMonths(testPrismaClient, calendarId);
    return months.map((m) => `${m.year}-${m.month}`);
  }

  it("returns every published month in ascending order, past months and a year boundary included", async () => {
    await Promise.all(
      [
        [2025, 3],
        [2027, 1],
        [2026, 12],
        [2026, 9],
      ].map(([year, m]) => month(year, m)),
    );

    expect(await published()).toEqual([
      "2025-3",
      "2026-9",
      "2026-12",
      "2027-1",
    ]);
  });

  it("leaves out DRAFT months", async () => {
    await month(2026, 10, "DRAFT");
    const row = await month(2026, 11);

    expect(await findPublishedMonths(testPrismaClient, calendarId)).toEqual([
      { id: row.id, year: 2026, month: 11 },
    ]);
  });

  it("leaves out another calendar's months", async () => {
    const other = await testPrismaClient.calendar.findUniqueOrThrow({
      where: {
        code: OTHER_CALENDAR_CODE,
      },
    });
    await month(2026, 10, "PUBLISHED", other.id);

    expect(await published()).toEqual([]);
  });
});
