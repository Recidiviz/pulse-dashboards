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

import { deriveDomainRiskLevel } from "../utils";

describe("deriveDomainRiskLevel", () => {
  // ORAS_CST Substance Use: moderate starts at 3, high starts at 5.
  // Regression case for MO-11748: 2/6 is 33.3%, which the old percentage-based
  // bucketing misclassified as MODERATE instead of LOW.
  const substanceUseCutoffs = { moderate: 3, high: 5 };

  test("returns LOW below the moderate threshold, even when percentage math would round up", () => {
    expect(deriveDomainRiskLevel(2, substanceUseCutoffs)).toBe("LOW");
  });

  test("returns MODERATE and HIGH at their respective thresholds", () => {
    expect(deriveDomainRiskLevel(3, substanceUseCutoffs)).toBe("MODERATE");
    expect(deriveDomainRiskLevel(4, substanceUseCutoffs)).toBe("MODERATE");
    expect(deriveDomainRiskLevel(5, substanceUseCutoffs)).toBe("HIGH");
  });

  test("has no upper bound on HIGH (e.g. ORAS_SRT's 7+)", () => {
    const criminalHistoryCutoffs = { moderate: 4, high: 7 };
    expect(deriveDomainRiskLevel(7, criminalHistoryCutoffs)).toBe("HIGH");
    expect(deriveDomainRiskLevel(100, criminalHistoryCutoffs)).toBe("HIGH");
  });

  test("treats a negative score as LOW rather than unclassified", () => {
    expect(deriveDomainRiskLevel(-1, substanceUseCutoffs)).toBe("LOW");
  });

  test("returns null for a null score", () => {
    expect(deriveDomainRiskLevel(null, substanceUseCutoffs)).toBeNull();
  });
});
