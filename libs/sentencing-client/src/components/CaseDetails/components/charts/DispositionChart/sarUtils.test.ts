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

import { formatSARDispositionPercentage } from "./sarUtils";

describe("formatSARDispositionPercentage", () => {
  it.each([
    // Shares that round to 1% or more stay whole numbers.
    [0.42, "42"],
    [0.009, "1"],
    // 0.5% is the rounding boundary, so it rounds up to a whole number.
    [0.005, "1"],
    // Non-zero shares that would round to 0% get one decimal place.
    [0.0049, "0.5"],
    [0.004, "0.4"],
    // 0.05% is the smallest share that still shows a decimal.
    [0.0005, "0.1"],
    [0.0004, "<0.1"],
    // Callers filter out 0 shares before formatting.
    [0, "<0.1"],
  ])("formats %s as %s", (decimal, expected) => {
    expect(formatSARDispositionPercentage(decimal)).toBe(expected);
  });
});
