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

import { render, screen } from "@testing-library/react";

import { ParoleCase, paroleCasesFixtureByState } from "~datatypes";

import type { ParoleConfig } from "../../../../models/types";
import { UsIdParoleSidebarSection } from "../UsIdParoleSidebarSection";

const CASE_DETAIL: ParoleCase = Object.values(
  paroleCasesFixtureByState.US_ID,
)[0];

function makeConfig(overrides: Partial<ParoleConfig> = {}): ParoleConfig {
  return {
    sections: [],
    conductClassificationColors: {},
    ...overrides,
  };
}

describe("UsIdParoleSidebarSection", () => {
  it("renders both the instant offenses and the assessments block", () => {
    render(
      <UsIdParoleSidebarSection
        caseDetail={CASE_DETAIL}
        config={makeConfig({
          riskAssessmentConfig: {
            tools: ["LSI"],
            aggregateView: { label: "All", tools: ["LSI"] },
          },
        })}
      />,
    );

    expect(screen.getByText("Instant Offenses")).toBeInTheDocument();
    expect(screen.getByText("Assessments")).toBeInTheDocument();
  });

  it("hides the assessments block when no tools are configured", () => {
    render(
      <UsIdParoleSidebarSection
        caseDetail={CASE_DETAIL}
        config={makeConfig()}
      />,
    );

    expect(screen.getByText("Instant Offenses")).toBeInTheDocument();
    expect(screen.queryByText("Assessments")).not.toBeInTheDocument();
  });
});
