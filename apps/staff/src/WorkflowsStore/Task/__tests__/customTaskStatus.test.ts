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

import { Timestamp } from "firebase/firestore";

import { CustomTaskRecord } from "../../../FirestoreStore";
import {
  getNextDueDate,
  getTaskCaptionParts,
  isTaskCompleted,
  isTaskDeleted,
} from "../customTaskStatus";

const BASE: Pick<CustomTaskRecord, "completedOn" | "dueDate" | "recurrence"> = {
  completedOn: null,
  dueDate: new Date(2026, 5, 19), // Friday, June 19, 2026
  recurrence: null,
};

describe("getNextDueDate", () => {
  test("non-recurring task returns the stored dueDate", () => {
    const result = getNextDueDate(
      { ...BASE, dueDate: new Date(2026, 5, 19) },
      new Date(2026, 5, 22),
    );
    expect(result).toEqual(new Date(2026, 5, 19));
  });

  test("non-recurring task accepts Timestamp dueDate", () => {
    const dueDate = Timestamp.fromDate(new Date(2026, 5, 19));
    const result = getNextDueDate({ ...BASE, dueDate }, new Date(2026, 5, 22));
    expect(result.getTime()).toBe(dueDate.toMillis());
  });

  test("recurring task with no completion returns the current cycle's date", () => {
    // Weekly Fri starting Jun 19. Today is Wed Jun 24 — Jun 19 was the
    // most recent occurrence.
    const result = getNextDueDate(
      { ...BASE, recurrence: "FREQ=WEEKLY;BYDAY=FR" },
      new Date(2026, 5, 24),
    );
    expect(result).toEqual(new Date(2026, 5, 19));
  });

  test("recurring task with no completion + future first occurrence returns dueDate", () => {
    // First Fri is in the future relative to "now".
    const result = getNextDueDate(
      {
        ...BASE,
        dueDate: new Date(2026, 5, 19),
        recurrence: "FREQ=WEEKLY;BYDAY=FR",
      },
      new Date(2026, 5, 10),
    );
    expect(result).toEqual(new Date(2026, 5, 19));
  });

  test("recurring task with completedOn returns the next occurrence after that", () => {
    // Weekly Fri, completed Jun 19 17:00 → next is Jun 26.
    const result = getNextDueDate(
      {
        ...BASE,
        recurrence: "FREQ=WEEKLY;BYDAY=FR",
        completedOn: new Date(2026, 5, 19, 17),
      },
      new Date(2026, 5, 20),
    );
    expect(result).toEqual(new Date(2026, 5, 26));
  });

  test("malformed RRULE falls back to dueDate", () => {
    const result = getNextDueDate(
      { ...BASE, recurrence: "not an rrule" },
      new Date(2026, 5, 22),
    );
    expect(result).toEqual(BASE.dueDate);
  });
});

describe("isTaskCompleted", () => {
  test("non-recurring → completedOn presence marks it complete", () => {
    expect(
      isTaskCompleted(
        { ...BASE, completedOn: new Date(2026, 5, 20) },
        new Date(2026, 5, 22),
      ),
    ).toBe(true);
  });

  test("non-recurring → null completedOn marks it incomplete", () => {
    expect(
      isTaskCompleted({ ...BASE, completedOn: null }, new Date(2026, 5, 22)),
    ).toBe(false);
  });

  test("recurring + no completedOn → always false", () => {
    expect(
      isTaskCompleted(
        { ...BASE, recurrence: "FREQ=WEEKLY;BYDAY=FR" },
        new Date(2026, 5, 22),
      ),
    ).toBe(false);
  });

  test("recurring + completedOn in current cycle → true while next is in the future", () => {
    // Completed Jun 19 17:00; today Jun 22 (before Jun 26 next occurrence).
    expect(
      isTaskCompleted(
        {
          ...BASE,
          recurrence: "FREQ=WEEKLY;BYDAY=FR",
          completedOn: new Date(2026, 5, 19, 17),
        },
        new Date(2026, 5, 22),
      ),
    ).toBe(true);
  });

  test("recurring + completedOn from previous cycle → false once the new cycle arrives", () => {
    // Completed Jun 19 17:00; today Jun 27 (past Jun 26 next occurrence).
    expect(
      isTaskCompleted(
        {
          ...BASE,
          recurrence: "FREQ=WEEKLY;BYDAY=FR",
          completedOn: new Date(2026, 5, 19, 17),
        },
        new Date(2026, 5, 27),
      ),
    ).toBe(false);
  });

  test("recurring + completedOn from the cycle two cycles ago → still false", () => {
    expect(
      isTaskCompleted(
        {
          ...BASE,
          recurrence: "FREQ=WEEKLY;BYDAY=FR",
          completedOn: new Date(2026, 5, 19, 17),
        },
        new Date(2026, 6, 4),
      ),
    ).toBe(false);
  });

  test("recurring monthly rolls over the same way", () => {
    // Monthly on the 18th; completed Jun 18; today Jul 19 (past Jul 18).
    expect(
      isTaskCompleted(
        {
          ...BASE,
          dueDate: new Date(2026, 5, 18),
          recurrence: "FREQ=MONTHLY;BYMONTHDAY=18",
          completedOn: new Date(2026, 5, 18, 12),
        },
        new Date(2026, 6, 19),
      ),
    ).toBe(false);
  });
});

describe("isTaskDeleted", () => {
  test("null deletedOn → not deleted", () => {
    expect(isTaskDeleted({ deletedOn: null })).toBe(false);
  });

  test("Date-valued deletedOn → deleted", () => {
    expect(isTaskDeleted({ deletedOn: new Date(2026, 5, 19) })).toBe(true);
  });

  test("Timestamp-valued deletedOn → deleted", () => {
    expect(
      isTaskDeleted({ deletedOn: Timestamp.fromDate(new Date(2026, 5, 19)) }),
    ).toBe(true);
  });

  // Regression: a prior implementation compared `deletedOn` against `now`
  // and was therefore always false, since `deletedOn` is stamped via
  // `serverTimestamp()` at delete time and so is never in the future.
  test("a deletedOn timestamp far in the past is still deleted", () => {
    expect(isTaskDeleted({ deletedOn: new Date(2000, 0, 1) })).toBe(true);
  });
});

describe("getTaskCaptionParts", () => {
  test("returns no parts when there's no recurrence and the task is neither completed nor deleted", () => {
    expect(getTaskCaptionParts({ ...BASE, deletedOn: null }, false)).toEqual(
      [],
    );
  });

  // Present tense while the recurrence is still active (not deleted).
  test("returns the recurrence description alone, present tense", () => {
    expect(
      getTaskCaptionParts(
        { ...BASE, recurrence: "FREQ=WEEKLY;BYDAY=FR", deletedOn: null },
        false,
      ),
    ).toEqual(["Repeats every week on Friday"]);
  });

  // Past tense once deletion has ended the recurrence.
  test("switches to past tense ('Repeated') when the recurring task is deleted", () => {
    expect(
      getTaskCaptionParts({
        ...BASE,
        recurrence: "FREQ=WEEKLY;BYDAY=FR",
        deletedOn: new Date(2026, 5, 20),
      }),
    ).toEqual([
      "Repeated every week on Friday",
      `Deleted ${new Date(2026, 5, 20).toLocaleDateString("en-US")}`,
    ]);
  });

  // Regression: Firestore's `Timestamp` has no `toLocaleString` of its own,
  // so it fell through to `Object.prototype.toLocaleString`, which just
  // calls `.toString()` — rendering "Timestamp(seconds=..., nanoseconds=...)"
  // instead of a date.
  test("formats a Timestamp-valued completedOn as a date, not the raw Timestamp", () => {
    const completedOn = new Date(2026, 5, 19, 17);
    const parts = getTaskCaptionParts(
      {
        ...BASE,
        completedOn: Timestamp.fromDate(completedOn),
        deletedOn: null,
      },
      true,
    );
    expect(parts).toEqual([
      `Completed ${completedOn.toLocaleDateString("en-US")}`,
    ]);
    expect(parts.join()).not.toContain("Timestamp(seconds=");
  });

  test("formats a Date-valued deletedOn", () => {
    const deletedOn = new Date(2026, 5, 20);
    expect(getTaskCaptionParts({ ...BASE, deletedOn }, false)).toEqual([
      `Deleted ${deletedOn.toLocaleDateString("en-US")}`,
    ]);
  });

  test("includes both a recurrence part and a 'Last completed' part when recurring and completed", () => {
    const completedOn = new Date(2026, 5, 19, 17);
    const parts = getTaskCaptionParts(
      {
        ...BASE,
        recurrence: "FREQ=WEEKLY;BYDAY=FR",
        completedOn,
        deletedOn: null,
      },
      true,
    );
    expect(parts).toEqual([
      "Repeats every week on Friday",
      `Last completed ${completedOn.toLocaleDateString("en-US")}`,
    ]);
  });

  test("includes all three parts when recurring, completed, and deleted", () => {
    const completedOn = new Date(2026, 5, 19, 17);
    const deletedOn = new Date(2026, 5, 20);
    const parts = getTaskCaptionParts(
      { ...BASE, recurrence: "FREQ=WEEKLY;BYDAY=FR", completedOn, deletedOn },
      true,
    );
    expect(parts).toEqual([
      "Repeated every week on Friday",
      `Last completed ${completedOn.toLocaleDateString("en-US")}`,
      `Deleted ${deletedOn.toLocaleDateString("en-US")}`,
    ]);
  });

  test("derives `completed` itself when the second argument is omitted", () => {
    const completedOn = new Date(2026, 5, 19);
    expect(
      getTaskCaptionParts({ ...BASE, completedOn, deletedOn: null }),
    ).toEqual([`Completed ${completedOn.toLocaleDateString("en-US")}`]);
  });
});
