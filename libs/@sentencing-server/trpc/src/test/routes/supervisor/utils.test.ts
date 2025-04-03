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

import moment from "moment";

import { isDueWithinLast30Days } from "~@sentencing-server/trpc/routes/supervisor/utils";

describe("isDueWithinLast30Days", () => {
  // Freeze time to a fixed date so that the computed boundaries remain consistent.
  beforeAll(() => {
    vitest.useFakeTimers();
    vitest.setSystemTime(new Date("2025-03-31T09:03:00Z"));
  });

  afterAll(() => {
    vitest.useRealTimers();
  });

  it("should return false when dueDate is null", () => {
    expect(isDueWithinLast30Days(null)).toBe(false);
  });

  it("should return false when dueDate is more than 30 days in the past", () => {
    const date31DaysAgo = moment().utc().subtract(31, "days").toDate();
    expect(isDueWithinLast30Days(date31DaysAgo)).toBe(false);
  });

  it("should return true when dueDate is within the past 30 days", () => {
    const date10DaysAgo = moment().utc().subtract(10, "days").toDate();
    expect(isDueWithinLast30Days(date10DaysAgo)).toBe(true);
  });

  it("should return false when dueDate is in the future", () => {
    const futureDate = moment().utc().add(1, "day").toDate();
    expect(isDueWithinLast30Days(futureDate)).toBe(false);
  });

  it("should return true for dueDate exactly 30 days ago", () => {
    const exactly30DaysAgo = moment().utc().subtract(30, "days").toDate();
    expect(isDueWithinLast30Days(exactly30DaysAgo)).toBe(true);
  });

  it("should return false for dueDate exactly equal to now", () => {
    const now = moment().utc().toDate();
    expect(isDueWithinLast30Days(now)).toBe(false);
  });

  it("should include due date exactly 30 days ago regardless of the time portion", () => {
    // With system time set to 2025-03-31T09:03:00Z, a due date of 2025-03-04T00:00:00.000Z
    // should be considered within the past 30 days.
    const boundaryDueDate = moment("2025-03-01T00:00:00.000Z").utc().toDate();
    expect(isDueWithinLast30Days(boundaryDueDate)).toBe(true); // This would fail if we were considering the time portion.
  });
});
