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

import { BreakdownAssessmentQuestionPeriod } from "~datatypes";

import { dateWindowString } from "../utils";

const TODAY = new Date("2026-06-17");
const mockRecord = {
  sixMonthsAgo: new Date("2026-01-01"),
  twelveMonthsAgo: new Date("2025-07-01"),
  eighteenMonthsAgo: new Date("2025-01-01"),
  thirtySixMonthsAgo: new Date("2023-07-01"),
  sixtyMonthsAgo: new Date("2021-07-01"),
};

describe("dateWindowString", () => {
  beforeEach(() => {
    vi.setSystemTime(TODAY);
  });

  it("uses the previous month month for period starting in 0", () => {
    expect(dateWindowString("0-6", mockRecord)).toBe("Jan 2026 - May 2026");
  });

  it.each([
    ["6-12", "Jul 2025 - Dec 2025"],
    ["12-18", "Jan 2025 - Jun 2025"],
    ["18-36", "Jul 2023 - Dec 2024"],
    ["36-60", "Jul 2021 - Jun 2023"],
  ] satisfies [BreakdownAssessmentQuestionPeriod, string][])(
    "period %s evaluates to %s",
    (period, formatted) =>
      expect(dateWindowString(period, mockRecord)).toBe(formatted),
  );
});
