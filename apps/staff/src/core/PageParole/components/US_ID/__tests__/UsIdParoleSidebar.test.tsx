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

import { paroleCasesFixtureByState } from "~datatypes";

import { ParoleConfig } from "../../../../models/types";
import { UsIdParoleSidebar } from "../UsIdParoleSidebar";

const CASE = paroleCasesFixtureByState.US_ID["166184"];

// reportAuthor is optional on the schema; narrow it once here so the tests
// below can assert against CASE's own value instead of a duplicated literal.
const { reportAuthor } = CASE;
if (!reportAuthor) {
  throw new Error("Expected the US_ID sample case to set a report author.");
}

function makeConfig(overrides: Partial<ParoleConfig> = {}): ParoleConfig {
  return {
    conductHistoryConfig: { classificationColors: {} },
    ...overrides,
  };
}

const CONFIG_WITH_TOOLS = makeConfig({
  riskAssessmentConfig: {
    tools: ["LSIR"],
    aggregateView: { label: "All", tools: ["LSIR"] },
  },
});

describe("UsIdParoleSidebar", () => {
  it("drops the 'Incarcerated' status text", () => {
    render(<UsIdParoleSidebar caseDetail={CASE} config={CONFIG_WITH_TOOLS} />);

    expect(screen.queryByText(/Incarcerated/)).not.toBeInTheDocument();
  });

  it("shows custody level and facility on their own lines, without supervision level", () => {
    render(<UsIdParoleSidebar caseDetail={CASE} config={CONFIG_WITH_TOOLS} />);

    expect(screen.getByText(CASE.custodyLevel)).toBeInTheDocument();
    expect(screen.getByText(CASE.currentFacility)).toBeInTheDocument();
    // Supervision level was dropped -- Idaho does not store it.
    expect(screen.queryByText(/Level 3/)).not.toBeInTheDocument();
  });

  it("shows a Report Status block with hearing type, report author, and hearing date", () => {
    render(<UsIdParoleSidebar caseDetail={CASE} config={CONFIG_WITH_TOOLS} />);

    expect(screen.getByText("Report Status")).toBeInTheDocument();
    expect(screen.getByText("Hearing Type")).toBeInTheDocument();
    expect(screen.getByText(CASE.hearingType)).toBeInTheDocument();
    expect(screen.getByText(reportAuthor)).toBeInTheDocument();

    // Report Author sits above the hearing date, per the V1 design.
    const author = screen.getByText("Report Author");
    const hearing = screen.getByText("Parole Board Hearing");
    expect(
      author.compareDocumentPosition(hearing) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    // Facility moved to the identity block; Case Manager is not shown for US_ID.
    expect(screen.queryByText("Facility")).not.toBeInTheDocument();
    expect(screen.queryByText("Case Manager")).not.toBeInTheDocument();
  });

  it("renders Personal Details but no Sentence Info", () => {
    render(<UsIdParoleSidebar caseDetail={CASE} config={CONFIG_WITH_TOOLS} />);

    expect(screen.getByText("Personal Details")).toBeInTheDocument();
    // Sentence data is tied to each instant offense, not shown in the sidebar.
    expect(screen.queryByText("Sentence Info")).not.toBeInTheDocument();
  });

  it("renders instant offenses and assessments before the Report Status block", () => {
    render(<UsIdParoleSidebar caseDetail={CASE} config={CONFIG_WITH_TOOLS} />);

    const instantOffenses = screen.getByText("Instant Offenses");
    const assessments = screen.getByText("Assessments");
    const reportStatus = screen.getByText("Report Status");

    expect(instantOffenses).toBeInTheDocument();
    expect(assessments).toBeInTheDocument();
    // Both blocks precede Report Status in the document, matching the design.
    expect(
      instantOffenses.compareDocumentPosition(reportStatus) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      assessments.compareDocumentPosition(reportStatus) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("hides the assessments block when no tools are configured", () => {
    render(<UsIdParoleSidebar caseDetail={CASE} config={makeConfig()} />);

    expect(screen.getByText("Instant Offenses")).toBeInTheDocument();
    expect(screen.queryByText("Assessments")).not.toBeInTheDocument();
  });
});
