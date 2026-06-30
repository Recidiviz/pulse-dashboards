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
  test("returns HIGH when score is >= 67% of maxScore", () => {
    expect(deriveDomainRiskLevel(6, 8)).toBe("HIGH"); // 75%
    expect(deriveDomainRiskLevel(8, 8)).toBe("HIGH"); // 100%
  });

  test("returns MODERATE when score is >= 33% and < 67% of maxScore", () => {
    expect(deriveDomainRiskLevel(3, 8)).toBe("MODERATE"); // 37.5%
    expect(deriveDomainRiskLevel(5, 8)).toBe("MODERATE"); // 62.5%
  });

  test("returns LOW when score is < 33% of maxScore", () => {
    expect(deriveDomainRiskLevel(0, 8)).toBe("LOW"); // 0%
    expect(deriveDomainRiskLevel(2, 8)).toBe("LOW"); // 25%
  });

  test("returns null for a null score", () => {
    expect(deriveDomainRiskLevel(null, 8)).toBeNull();
  });

  test("returns null when maxScore is undefined or zero", () => {
    expect(deriveDomainRiskLevel(5, undefined)).toBeNull();
    expect(deriveDomainRiskLevel(5, 0)).toBeNull();
  });
});
