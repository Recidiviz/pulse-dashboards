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
  buildStatic99RReportText,
  deriveDomainRiskLevel,
  deriveStatic99RRiskCategory,
  STATIC_99R_INTRO,
} from "../utils";

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

describe("deriveStatic99RRiskCategory", () => {
  test("returns LOW for scores at or below 1", () => {
    expect(deriveStatic99RRiskCategory(-3)).toBe("LOW");
    expect(deriveStatic99RRiskCategory(1)).toBe("LOW");
  });

  test("returns MODERATE_LOW for scores between 2 and 3", () => {
    expect(deriveStatic99RRiskCategory(2)).toBe("MODERATE_LOW");
    expect(deriveStatic99RRiskCategory(3)).toBe("MODERATE_LOW");
  });

  test("returns MODERATE_HIGH for scores between 4 and 5", () => {
    expect(deriveStatic99RRiskCategory(4)).toBe("MODERATE_HIGH");
    expect(deriveStatic99RRiskCategory(5)).toBe("MODERATE_HIGH");
  });

  test("returns HIGH for scores above 5", () => {
    expect(deriveStatic99RRiskCategory(6)).toBe("HIGH");
    expect(deriveStatic99RRiskCategory(12)).toBe("HIGH");
  });
});

describe("buildStatic99RReportText", () => {
  test("returns just the intro when there's no score", () => {
    expect(buildStatic99RReportText("John Doe", "MALE", null)).toBe(
      STATIC_99R_INTRO,
    );
  });

  test("includes the offender name, score, and risk category label", () => {
    const text = buildStatic99RReportText("John Doe", "MALE", 6);
    expect(text).toContain(STATIC_99R_INTRO);
    expect(text).toContain(
      "John Doe scored 6 on this risk assessment instrument.",
    );
    expect(text).toContain("places John Doe in the High risk category");
  });

  test("uses the gendered adjective when gender is known", () => {
    expect(buildStatic99RReportText("Jane Doe", "FEMALE", 0)).toContain(
      "relative to other female sex offenders.",
    );
    expect(buildStatic99RReportText("John Doe", "MALE", 0)).toContain(
      "relative to other male sex offenders.",
    );
  });

  test('falls back to "adult" when gender is null or undefined', () => {
    expect(buildStatic99RReportText("J. Doe", null, 0)).toContain(
      "relative to other adult sex offenders.",
    );
    expect(buildStatic99RReportText("J. Doe", undefined, 0)).toContain(
      "relative to other adult sex offenders.",
    );
  });
});
