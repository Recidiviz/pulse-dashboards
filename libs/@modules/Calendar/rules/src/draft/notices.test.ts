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
  entriesOutsideMonthMessage,
  formatNoticeDate,
  joinLabels,
  kindWithoutPatternMessage,
} from "./notices";
import { OutsideMonthEntry } from "./types";

const SEPTEMBER_2026 = { year: 2026, month: 9 };
const KIND_LABELS = new Map([
  ["kind-VISIT", "Visit"],
  ["kind-STAFF_MEETING", "Staff meeting"],
]);

/** An entry left out of September 2026. The copy reads only date, kindId and label. */
function outside(
  date: string,
  label: string,
  kindId = "kind-VISIT",
): OutsideMonthEntry {
  return {
    date,
    kindId,
    kindCode: kindId.replace("kind-", ""),
    resourceId: null,
    slotKey: label,
    label,
    rule: { type: "everyWeekday", weekday: "THURSDAY" },
    startTime: null,
    endTime: null,
  };
}

describe("formatNoticeDate", () => {
  it.each([
    ["2026-10-01", "Thursday, October 1"],
    ["2026-10-04", "Sunday, October 4"],
    ["2026-10-05", "Monday, October 5"],
    ["2027-01-31", "Sunday, January 31"],
    ["2026-12-25", "Friday, December 25"],
  ])("formats %s as %j", (date, text) => {
    expect(formatNoticeDate(date)).toBe(text);
  });
});

describe("joinLabels", () => {
  it.each<[string[], string]>([
    [[], ""],
    [["A"], "A"],
    [["A", "B"], "A and B"],
    [["A", "B", "C"], "A, B, and C"],
    [["A", "B", "C", "D"], "A, B, C, and D"],
  ])("joins %j as %j", (labels, text) => {
    expect(joinLabels(labels)).toBe(text);
  });
});

describe("kindWithoutPatternMessage", () => {
  it("names the kind's label", () => {
    expect(kindWithoutPatternMessage({ label: "Review" })).toBe(
      "Review entries weren't added because their schedule isn't set yet. Add them by hand if this month needs any.",
    );
  });
});

describe("entriesOutsideMonthMessage", () => {
  it("uses the kind's label, singular, for one entry", () => {
    expect(
      entriesOutsideMonthMessage(
        SEPTEMBER_2026,
        [outside("2026-10-01", "Room A")],
        KIND_LABELS,
      ),
    ).toBe(
      "1 visit falls after September ends and wasn't added: Room A on Thursday, October 1.",
    );
  });

  it("uses the kind's label, plural, when every entry has that kind", () => {
    expect(
      entriesOutsideMonthMessage(
        SEPTEMBER_2026,
        [outside("2026-10-01", "Room A"), outside("2026-10-01", "Room B")],
        KIND_LABELS,
      ),
    ).toBe(
      "2 visits fall after September ends and weren't added: Room A and Room B on Thursday, October 1.",
    );
  });

  it('says "entries" when the kinds mix', () => {
    expect(
      entriesOutsideMonthMessage(
        SEPTEMBER_2026,
        [
          outside("2026-10-01", "Room A"),
          outside("2026-10-02", "Staff meeting", "kind-STAFF_MEETING"),
        ],
        KIND_LABELS,
      ),
    ).toBe(
      "2 entries fall after September ends and weren't added: Room A on Thursday, October 1; Staff meeting on Friday, October 2.",
    );
  });

  it('says "entry" for one entry whose kind has no label', () => {
    expect(
      entriesOutsideMonthMessage(
        SEPTEMBER_2026,
        [outside("2026-10-01", "Room A", "kind-UNKNOWN")],
        KIND_LABELS,
      ),
    ).toBe(
      "1 entry falls after September ends and wasn't added: Room A on Thursday, October 1.",
    );
  });

  it("groups several dates in list order, joining the labels on each date", () => {
    expect(
      entriesOutsideMonthMessage(
        SEPTEMBER_2026,
        [
          outside("2026-10-01", "Room A"),
          outside("2026-10-01", "Room B"),
          outside("2026-10-01", "Room C"),
          outside("2026-10-02", "Room A"),
          outside("2026-10-03", "Room B"),
        ],
        KIND_LABELS,
      ),
    ).toBe(
      "5 visits fall after September ends and weren't added: Room A, Room B, and Room C on Thursday, October 1; Room A on Friday, October 2; Room B on Saturday, October 3.",
    );
  });
});
