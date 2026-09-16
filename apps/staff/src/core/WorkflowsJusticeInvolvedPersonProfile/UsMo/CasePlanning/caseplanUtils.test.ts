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

import { describe, expect, test } from "vitest";

import {
  compareObjectivesByStatus,
  getObjectiveDueStatus,
  paginateCasePlanGoals,
} from "./caseplanUtils";

// Local Date construction (year, monthIndex, day) to avoid the UTC-midnight
// drift that `new Date("2026-06-23")` would introduce. June is monthIndex 5.
const NOW = new Date(2026, 5, 23);

describe("getObjectiveDueStatus", () => {
  test("returns 'completed' when completionDate is set, regardless of plannedEndDate", () => {
    expect(
      getObjectiveDueStatus(new Date(2026, 5, 1), new Date(2025, 0, 1), NOW),
    ).toBe("completed");
  });

  test("returns 'overdue' for a planned date before the start of now's day", () => {
    expect(getObjectiveDueStatus(null, new Date(2026, 5, 22), NOW)).toBe(
      "overdue",
    );
  });

  test("returns 'overdue' for a far-past planned date", () => {
    expect(getObjectiveDueStatus(null, new Date(2025, 0, 1), NOW)).toBe(
      "overdue",
    );
  });

  test("treats a time earlier the same calendar day as overdue", () => {
    // `now` is midnight-local (2026-06-23 00:00); a planned date at
    // 2026-06-22 23:59 is before the start of today, so it is overdue.
    expect(
      getObjectiveDueStatus(null, new Date(2026, 5, 22, 23, 59), NOW),
    ).toBe("overdue");
  });

  test("returns 'dueSoon' when due today", () => {
    expect(getObjectiveDueStatus(null, new Date(2026, 5, 23), NOW)).toBe(
      "dueSoon",
    );
  });

  test("returns 'dueSoon' when due tomorrow", () => {
    expect(getObjectiveDueStatus(null, new Date(2026, 5, 24), NOW)).toBe(
      "dueSoon",
    );
  });

  test("returns 'dueSoon' when due exactly 7 calendar days out", () => {
    expect(getObjectiveDueStatus(null, new Date(2026, 5, 30), NOW)).toBe(
      "dueSoon",
    );
  });

  test("returns 'due' when due 8 calendar days out", () => {
    expect(getObjectiveDueStatus(null, new Date(2026, 6, 1), NOW)).toBe("due");
  });

  test("returns 'due' for a far-future planned date", () => {
    expect(getObjectiveDueStatus(null, new Date(2027, 0, 1), NOW)).toBe("due");
  });

  test("returns null when neither date is set", () => {
    expect(getObjectiveDueStatus(null, null, NOW)).toBeNull();
  });

  test("returns null for undefined dates", () => {
    expect(getObjectiveDueStatus(undefined, undefined, NOW)).toBeNull();
  });

  test("defaults `now` to the current time when omitted", () => {
    // A clearly-past planned date is always overdue regardless of the real clock.
    expect(getObjectiveDueStatus(null, new Date(2000, 0, 1))).toBe("overdue");
  });
});

describe("compareObjectivesByStatus", () => {
  const overdue = {
    objectiveEndDate: null,
    objectivePlannedEndDate: new Date(2026, 5, 1),
  };
  const dueSoon = {
    objectiveEndDate: null,
    objectivePlannedEndDate: new Date(2026, 5, 24),
  };
  const due = {
    objectiveEndDate: null,
    objectivePlannedEndDate: new Date(2027, 0, 1),
  };
  const noDate = {
    objectiveEndDate: null,
    objectivePlannedEndDate: null,
  };
  const completed = {
    objectiveEndDate: new Date(2026, 4, 1),
    objectivePlannedEndDate: new Date(2026, 4, 1),
  };

  test("sorts overdue before dueSoon before due before no-date before completed", () => {
    const items = [completed, noDate, due, dueSoon, overdue];
    const sorted = [...items].sort((a, b) =>
      compareObjectivesByStatus(a, b, NOW),
    );
    expect(sorted).toEqual([overdue, dueSoon, due, noDate, completed]);
  });

  test("treats equal-status items as equal (stable order preserved by caller)", () => {
    expect(compareObjectivesByStatus(overdue, overdue, NOW)).toBe(0);
  });

  test("within a shared overdue status, sorts newer planned date first", () => {
    const overdueOlder = {
      objectiveEndDate: null,
      objectivePlannedEndDate: new Date(2026, 0, 1),
    };
    const overdueNewer = {
      objectiveEndDate: null,
      objectivePlannedEndDate: new Date(2026, 4, 1),
    };
    const sorted = [overdueOlder, overdueNewer].sort((a, b) =>
      compareObjectivesByStatus(a, b, NOW),
    );
    expect(sorted).toEqual([overdueNewer, overdueOlder]);
  });

  test("within a shared due status, sorts newer planned date first", () => {
    const dueSooner = {
      objectiveEndDate: null,
      objectivePlannedEndDate: new Date(2026, 6, 1),
    };
    const dueLater = {
      objectiveEndDate: null,
      objectivePlannedEndDate: new Date(2027, 0, 1),
    };
    const sorted = [dueSooner, dueLater].sort((a, b) =>
      compareObjectivesByStatus(a, b, NOW),
    );
    expect(sorted).toEqual([dueLater, dueSooner]);
  });

  test("within a shared completed status, sorts newer completion date first", () => {
    const completedOlder = {
      objectiveEndDate: new Date(2026, 0, 1),
      objectivePlannedEndDate: new Date(2026, 0, 1),
    };
    const completedNewer = {
      objectiveEndDate: new Date(2026, 4, 1),
      objectivePlannedEndDate: new Date(2026, 4, 1),
    };
    const sorted = [completedOlder, completedNewer].sort((a, b) =>
      compareObjectivesByStatus(a, b, NOW),
    );
    expect(sorted).toEqual([completedNewer, completedOlder]);
  });
});

describe("paginateCasePlanGoals", () => {
  const makeGoals = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      goal: `Goal ${i + 1}`,
      objectivesAndTechniques: [],
    }));

  test("fits exactly 3 goals on a single page", () => {
    const result = paginateCasePlanGoals(makeGoals(3), 0);
    expect(result.totalPages).toBe(1);
    expect(result.currentPage).toBe(0);
    expect(result.goals.map((g) => g.goal)).toEqual([
      "Goal 1",
      "Goal 2",
      "Goal 3",
    ]);
  });

  test("a 4th goal starts a second page", () => {
    const goals = makeGoals(4);
    const page0 = paginateCasePlanGoals(goals, 0);
    expect(page0.totalPages).toBe(2);
    expect(page0.goals.map((g) => g.goal)).toEqual([
      "Goal 1",
      "Goal 2",
      "Goal 3",
    ]);

    const page1 = paginateCasePlanGoals(goals, 1);
    expect(page1.goals.map((g) => g.goal)).toEqual(["Goal 4"]);
  });

  test("clamps a too-large requested page down to the last valid page", () => {
    const result = paginateCasePlanGoals(makeGoals(4), 10);
    expect(result.currentPage).toBe(1);
    expect(result.goals.map((g) => g.goal)).toEqual(["Goal 4"]);
  });

  test("clamps a negative requested page up to 0", () => {
    const result = paginateCasePlanGoals(makeGoals(4), -3);
    expect(result.currentPage).toBe(0);
  });

  test("returns totalPages 1 with an empty goals array for an empty case plan", () => {
    const result = paginateCasePlanGoals([], 0);
    expect(result.totalPages).toBe(1);
    expect(result.currentPage).toBe(0);
    expect(result.goals).toEqual([]);
  });

  test("supports a custom page size", () => {
    const result = paginateCasePlanGoals(makeGoals(5), 1, 2);
    expect(result.totalPages).toBe(3);
    expect(result.goals.map((g) => g.goal)).toEqual(["Goal 3", "Goal 4"]);
  });
});
