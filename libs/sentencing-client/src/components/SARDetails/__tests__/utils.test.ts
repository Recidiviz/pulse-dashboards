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

import { describe, expect, it } from "vitest";

import { SARSection } from "../constants";
import {
  type SARSectionScope,
  shouldShowInSARReport,
  shouldShowInSARSummary,
} from "../utils";

const participatingSAR: SARSectionScope = {
  isVictimImpactOnly: null,
  reportType: "SAR",
  defendantDeclinedToParticipate: false,
};
const declinedSAR: SARSectionScope = {
  ...participatingSAR,
  defendantDeclinedToParticipate: true,
};
const psrVictimImpactOnly: SARSectionScope = {
  isVictimImpactOnly: true,
  reportType: "PSR",
  defendantDeclinedToParticipate: false,
};
const psrVictimImpactOnlyDeclined: SARSectionScope = {
  ...psrVictimImpactOnly,
  defendantDeclinedToParticipate: true,
};
const psrAllExceptVictimImpact: SARSectionScope = {
  isVictimImpactOnly: false,
  reportType: "PSR",
  defendantDeclinedToParticipate: false,
};

describe("shouldShowInSARSummary", () => {
  it("shows Recommendation and Victim Impact for a SAR when the defendant participated", () => {
    expect(
      shouldShowInSARSummary(SARSection.RECOMMENDATION, participatingSAR),
    ).toBe(true);
    expect(
      shouldShowInSARSummary(SARSection.VICTIM_IMPACT, participatingSAR),
    ).toBe(true);
  });

  it("hides Recommendation when the defendant declined", () => {
    expect(shouldShowInSARSummary(SARSection.RECOMMENDATION, declinedSAR)).toBe(
      false,
    );
  });

  it("shows only Victim Impact and Summary for a PSR victim-impact-only officer", () => {
    expect(
      shouldShowInSARSummary(SARSection.VICTIM_IMPACT, psrVictimImpactOnly),
    ).toBe(true);
    expect(
      shouldShowInSARSummary(SARSection.SUMMARY, psrVictimImpactOnly),
    ).toBe(true);
    expect(
      shouldShowInSARSummary(SARSection.RECOMMENDATION, psrVictimImpactOnly),
    ).toBe(false);
    expect(
      shouldShowInSARSummary(SARSection.CASE_INFORMATION, psrVictimImpactOnly),
    ).toBe(false);
  });

  it("hides Victim Impact for a PSR all-except-victim-impact officer", () => {
    expect(
      shouldShowInSARSummary(
        SARSection.VICTIM_IMPACT,
        psrAllExceptVictimImpact,
      ),
    ).toBe(false);
  });
});

describe("shouldShowInSARReport", () => {
  it("shows Recommendation and Victim Impact for a SAR when the defendant participated", () => {
    expect(
      shouldShowInSARReport(SARSection.RECOMMENDATION, participatingSAR),
    ).toBe(true);
    expect(
      shouldShowInSARReport(SARSection.VICTIM_IMPACT, participatingSAR),
    ).toBe(true);
  });

  it("shows Recommendation when the defendant declined, for the fallback line", () => {
    expect(shouldShowInSARReport(SARSection.RECOMMENDATION, declinedSAR)).toBe(
      true,
    );
  });

  it("hides Recommendation for a PSR victim-impact-only officer even when declined", () => {
    expect(
      shouldShowInSARReport(
        SARSection.RECOMMENDATION,
        psrVictimImpactOnlyDeclined,
      ),
    ).toBe(false);
  });

  it("hides Victim Impact for a PSR all-except-victim-impact officer", () => {
    expect(
      shouldShowInSARReport(SARSection.VICTIM_IMPACT, psrAllExceptVictimImpact),
    ).toBe(false);
  });
});
