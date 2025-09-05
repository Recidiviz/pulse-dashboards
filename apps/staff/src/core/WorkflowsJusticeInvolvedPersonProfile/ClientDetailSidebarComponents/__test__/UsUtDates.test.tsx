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

import { parseISO } from "date-fns";

import { utDates } from "../UsUtDates";

describe("usUtDates helper function", () => {
  beforeEach(() => {
    vi.setSystemTime(parseISO("2025-06-02"));
  });

  describe("Report Due Date hiding logic", () => {
    it("Hides report due date when in past and client isn't eligible for ET", () => {
      const startDate = parseISO("2025-01-01");
      const endDate = parseISO("2025-07-01");
      const labels = utDates({
        startDate,
        endDate,
        isEligibleForET: false,
      }).map((d) => d.label);

      expect(labels).not.toContain("Early Term Report Due");
    });

    it("Shows report due date when in past and client is eligible for ET", () => {
      const startDate = parseISO("2025-01-01");
      const endDate = parseISO("2025-07-01");
      const labels = utDates({
        startDate,
        endDate,
        isEligibleForET: true,
      }).map((d) => d.label);

      expect(labels).toContain("Early Term Report Due");
    });

    it("Shows report due date when in future even if client isn't eligible", () => {
      const startDate = parseISO("2025-06-01");
      const endDate = parseISO("2030-06-01");
      const labels = utDates({
        startDate,
        endDate,
        isEligibleForET: false,
      }).map((d) => d.label);

      expect(labels).toContain("Early Term Report Due");
    });

    it("Shows report due date when it is exactly today", () => {
      // Based on this start and end date, the half-time date is July 2.
      // Then, the report due date, 30 days before the half-time date, is June 2.
      // Since June 2 is today and today counts as "not in the past",
      // we should still see the report due date row.
      const startDate = parseISO("2025-01-01");
      const endDate = parseISO("2025-12-31");

      const labels = utDates({
        startDate,
        endDate,
        isEligibleForET: false,
      }).map((d) => d.label);

      expect(labels).toContain("Early Term Report Due");
    });
  });

  describe("Half-time date calculation", () => {
    it("uses provided halfTimeDate instead of calculated date", () => {
      const startDate = parseISO("2025-01-01");
      const endDate = parseISO("2025-12-31");
      const setHalfTimeDate = parseISO("2025-09-31");
      const result = utDates({
        startDate,
        endDate,
        halfTimeDate: setHalfTimeDate,
        isEligibleForET: true,
      }).find((d) => d.label === "Early Term Review");

      expect(result).toBeDefined();
      expect(result?.date).toEqual(setHalfTimeDate);
    });

    it("calculates HalfTimeDate when not provided", () => {
      const startDate = parseISO("2025-01-01");
      const endDate = parseISO("2025-12-31");
      const expectedHalfTimeDate = parseISO("2025-07-02");
      const result = utDates({
        startDate,
        endDate,
        isEligibleForET: true,
      }).find((d) => d.label === "Early Term Review");

      expect(result).toBeDefined();
      expect(result?.date).toEqual(expectedHalfTimeDate);
    });
  });
});
