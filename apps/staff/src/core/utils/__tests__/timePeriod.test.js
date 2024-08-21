// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import tk from "timekeeper";

import { formatRelativeToNow, formatTimePeriodLabel } from "../timePeriod";

describe("timePeriod", () => {
  describe("formatTimePeriodLabel", () => {
    it("returns the correct labels", () => {
      expect(formatTimePeriodLabel("1")).toEqual("1 month");
      expect(formatTimePeriodLabel("3")).toEqual("3 months");
      expect(formatTimePeriodLabel("6")).toEqual("6 months");
      expect(formatTimePeriodLabel("12")).toEqual("1 year");
      expect(formatTimePeriodLabel("24")).toEqual("2 years");
      expect(formatTimePeriodLabel("60")).toEqual("5 years");
    });

    it("returns an empty string for empty or invalid months values", () => {
      expect(formatTimePeriodLabel("")).toEqual("");
      expect(formatTimePeriodLabel("a")).toEqual("");
      expect(formatTimePeriodLabel(null)).toEqual("");
      expect(formatTimePeriodLabel(undefined)).toEqual("");
    });
  });

  describe("formatRelativeToNow", () => {
    let now;

    beforeEach(() => {
      now = new Date(2022, 1);
      tk.freeze(now);
    });

    afterEach(() => {
      tk.reset();
    });

    test("formats as months", () => {
      expect(formatRelativeToNow(new Date(2021, 1, 1))).toBe("12 months");
      expect(formatRelativeToNow(new Date(2020, 1, 2))).toBe("23 months");
    });
    test("formats as years", () => {
      expect(formatRelativeToNow(new Date(2020, 1, 1))).toBe("2 years");
      expect(formatRelativeToNow(new Date(2016, 6, 1))).toBe("5 years");
    });
  });
});
