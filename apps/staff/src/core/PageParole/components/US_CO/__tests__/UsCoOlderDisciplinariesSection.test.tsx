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
import userEvent from "@testing-library/user-event";

import { ParoleCase, ParoleConductRecord } from "~datatypes";

import type { ParoleConfig } from "../../../../models/types";
import { UsCoOlderDisciplinariesSection } from "../UsCoOlderDisciplinariesSection";

// Mirrors US_CO's real window, so makeRecord's date lands outside it and the
// toggle has something to reveal.
const CONFIG: ParoleConfig = {
  sections: [],
  conductClassificationColors: { "Class 1": "BLUE" },
  conductHistoryVisibleYears: 1,
};

function makeRecord(fields: Partial<ParoleConductRecord>): ParoleConductRecord {
  return {
    date: "2024-12-01",
    facility: "Western State Prison",
    violation: "Unauthorized Area",
    description: "Found in restricted maintenance corridor.",
    severity: "Class 1",
    disposition: "Loss of privileges - 7 days",
    ...fields,
  };
}

function makeCaseDetail(fields: Partial<ParoleCase>): ParoleCase {
  return {
    docId: "45821",
    name: "Anderson, Michael",
    dob: "1986-07-27",
    gender: "Male",
    currentFacility: "Western State Prison",
    custodyLevel: "Minimum",
    caseManagerName: "Jennifer Martinez",
    sentenceStartDate: "2022-07-27",
    paroleEligibilityDate: "2026-08-16",
    mandatoryReleaseDate: "2028-06-26",
    parolePlan: { onFile: false, documents: [] },
    attachments: [],
    conductHistory: [],
    docPrograms: [],
    edovoPrograms: [],
    offenseHistory: {
      offenses: [
        {
          county: "Sangamon County",
          docket: "2021-CF-0489",
          conviction: "Armed Robbery",
          classFelony: "Class X Felony",
          sentence: "8 years",
          dateOfOffense: "2021-07-30",
          convictionDate: "2022-07-30",
          offenseNarrative: "Defendant entered convenience store with firearm.",
        },
      ],
      priorConvictions: [],
      victimInvolved: false,
      victimAttendingHearing: false,
    },
    riskAssessments: [],
    riskAndNeedsFactors: [],
    communitySupervisionPlan: [],
    ...fields,
  };
}

describe("UsCoOlderDisciplinariesSection", () => {
  it("renders nothing when there are no older records", () => {
    const { container } = render(
      <UsCoOlderDisciplinariesSection
        caseDetail={makeCaseDetail({ conductHistory: [] })}
        config={CONFIG}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows a toggle with the older record count, hidden until clicked", async () => {
    const record = makeRecord({ violation: "Unauthorized Area" });
    render(
      <UsCoOlderDisciplinariesSection
        caseDetail={makeCaseDetail({ conductHistory: [record] })}
        config={CONFIG}
      />,
    );

    expect(
      screen.getByRole("button", { name: /see older disciplinaries \(1\)/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Unauthorized Area")).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /see older disciplinaries/i }),
    );

    expect(screen.getByText("Unauthorized Area")).toBeInTheDocument();
  });
});
