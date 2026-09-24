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

import { getTrusteeCriterionNumber, TRUSTEE_CRITERIA } from "~datatypes";

import {
  criteriaMarkedFalse,
  TRUSTEE_SECTIONS,
} from "../TrusteeCriteriaSection";

describe("TRUSTEE_SECTIONS", () => {
  it("splits into the two named sections", () => {
    expect(TRUSTEE_SECTIONS.map((s) => s.section)).toEqual([
      "Trustee Custody and Annex Housing Criteria",
      "Additional Trustee Custody Criteria",
    ]);
  });

  it("puts groups A and B in section 1, and C through E in section 2", () => {
    expect(TRUSTEE_SECTIONS[0].groups.map((g) => g.key)).toEqual(["A", "B"]);
    expect(TRUSTEE_SECTIONS[1].groups.map((g) => g.key)).toEqual([
      "C",
      "D",
      "E",
    ]);
  });

  it("makes section 1 exactly the criteria that determine Annex eligibility", () => {
    const sectionOneKeys = TRUSTEE_SECTIONS[0].groups.flatMap((g) =>
      g.criteria.map((c) => c.key),
    );
    const annexKeys = TRUSTEE_CRITERIA.filter((c) => c.affectsAnnex).map(
      (c) => c.key,
    );

    expect(sectionOneKeys).toEqual(annexKeys);
  });

  it("renders every criterion exactly once, in display order", () => {
    const numbers = TRUSTEE_SECTIONS.flatMap((s) =>
      s.groups.flatMap((g) =>
        g.criteria.map((c) => getTrusteeCriterionNumber(c.key)),
      ),
    );

    expect(numbers).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);
  });

  it("carries a group note only on the conditional group", () => {
    const withNotes = TRUSTEE_SECTIONS.flatMap((s) => s.groups).filter(
      (g) => g.note,
    );

    expect(withNotes.map((g) => g.key)).toEqual(["E"]);
    expect(withNotes[0].note).toContain("does not disqualify");
  });

  it("never truncates a criterion, however long", () => {
    TRUSTEE_SECTIONS.flatMap((s) => s.groups)
      .flatMap((g) => g.criteria)
      .forEach((criterion) => {
        expect(criterion.text).not.toMatch(/\.\.\.|…/);
        expect(criterion.text.endsWith(".")).toBeTrue();
      });
  });

  it("marks a bold segment in every criterion so the polarity is scannable", () => {
    TRUSTEE_SECTIONS.flatMap((s) => s.groups)
      .flatMap((g) => g.criteria)
      .forEach((criterion) => {
        expect(criterion.text.split("**").length).toBeGreaterThan(1);
      });
  });
});

describe("criteriaMarkedFalse", () => {
  it("stays singular for one criterion", () => {
    expect(criteriaMarkedFalse([15])).toBe("criterion 15 was marked False");
  });

  it("turns plural for two", () => {
    expect(criteriaMarkedFalse([14, 15])).toBe(
      "criteria 14 and 15 were marked False",
    );
  });

  it("falls back to a comma list beyond two", () => {
    expect(criteriaMarkedFalse([13, 14, 15])).toBe(
      "criteria 13, 14 and 15 were marked False",
    );
  });

  it("carries no trailing punctuation, so callers can embed it", () => {
    expect(criteriaMarkedFalse([15])).not.toMatch(/[.,]$/);
  });
});
