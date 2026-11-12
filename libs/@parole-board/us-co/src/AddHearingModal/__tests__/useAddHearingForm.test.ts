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

import {
  september2026Config,
  september2026MonthDetail,
} from "~@parole-board/common/fixtures";

import { addEntryInputFor, defaultDay } from "../useAddHearingForm";

const MONTH = september2026MonthDetail;
const { allowedWeekdays } = september2026Config.calendar;
const NOTHING = { boardSession: null, facility: null, day: null };

describe("addEntryInputFor", () => {
  test("gives the input for an available choice on a day", () => {
    expect(
      addEntryInputFor(
        { ...NOTHING, facility: "resource:resource-FCF", day: "2026-09-16" },
        september2026Config,
        MONTH,
      ),
    ).toEqual({
      monthId: MONTH.id,
      date: "2026-09-16",
      kindCode: "HEARING",
      resourceId: "resource-FCF",
    });
  });

  test("gives nothing without a choice or a day", () => {
    expect(
      addEntryInputFor(
        { ...NOTHING, day: "2026-09-16" },
        september2026Config,
        MONTH,
      ),
    ).toBeNull();
    expect(
      addEntryInputFor(
        { ...NOTHING, boardSession: "kind:FULL_BOARD" },
        september2026Config,
        MONTH,
      ),
    ).toBeNull();
  });

  test("gives nothing for a choice already on the day", () => {
    // The fixture has FCF on September 14.
    expect(
      addEntryInputFor(
        { ...NOTHING, facility: "resource:resource-FCF", day: "2026-09-14" },
        september2026Config,
        MONTH,
      ),
    ).toBeNull();
  });
});

describe("defaultDay", () => {
  test("opens on the selected day when it's an allowed day", () => {
    expect(defaultDay(MONTH, "2026-09-14", allowedWeekdays)).toBe("2026-09-14");
  });

  test("falls back to the month's first allowed day", () => {
    expect(defaultDay(MONTH, null, allowedWeekdays)).toBe("2026-09-01");
    expect(defaultDay(MONTH, "2026-09-13", allowedWeekdays)).toBe("2026-09-01");
    expect(defaultDay(MONTH, "2026-10-14", allowedWeekdays)).toBe("2026-09-01");
  });
});
