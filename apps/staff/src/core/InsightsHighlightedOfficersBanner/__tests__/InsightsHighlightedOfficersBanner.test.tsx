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

import { HighlightedOfficersDetail } from "../../../InsightsStore/presenters/types";
import {
  highlightedOfficerText,
  shouldShowHighlightedOfficersBanner,
} from "../InsightsHighlightedOfficersBanner";

const baseDetail: HighlightedOfficersDetail = {
  metricName: "early discharges",
  officers: [{ pseudonymizedId: "hashed-so2", displayName: "Jack Hernandez" }],
  topXPct: 10,
  numOfficers: 1,
  outcomeType: "FAVORABLE",
};

describe("highlightedOfficerText", () => {
  it("uses 'highest' for FAVORABLE metrics", () => {
    const result = highlightedOfficerText(baseDetail, "agent", false, false);
    expect(result).toContain("for highest early discharges rate this year.");
    expect(result).not.toContain("for lowest");
  });

  it("uses 'lowest' for ADVERSE metrics", () => {
    const result = highlightedOfficerText(
      {
        ...baseDetail,
        metricName: "absconder warrants",
        outcomeType: "ADVERSE",
      },
      "agent",
      false,
      false,
    );
    expect(result).toContain("for lowest absconder warrants rate this year.");
    expect(result).not.toContain("for highest");
  });

  it("prefixes the officer's first name on the staff page", () => {
    const result = highlightedOfficerText(baseDetail, "agent", false, true);
    expect(result).toMatch(/^Jack is in the top 10% of agents/);
  });
});

describe("shouldShowHighlightedOfficersBanner", () => {
  it("preserves the existing CA banner without the new feature variant", () => {
    expect(shouldShowHighlightedOfficersBanner("US_CA", undefined)).toBe(true);
  });

  it("hides the banner for MI without the new feature variant", () => {
    expect(shouldShowHighlightedOfficersBanner("US_MI", undefined)).toBe(false);
  });

  it("shows the banner for MI with the new feature variant", () => {
    expect(shouldShowHighlightedOfficersBanner("US_MI", {})).toBe(true);
  });

  it("keeps non-MI tenants config-driven", () => {
    expect(shouldShowHighlightedOfficersBanner("US_TN", undefined)).toBe(true);
  });
});
