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

import { ParoleCase } from "~datatypes";

import type { ParoleConfig } from "../../../../models/types";
import { UsIdDisciplinaryFacilityNotesSection } from "../UsIdDisciplinaryFacilityNotesSection";

const CONFIG: ParoleConfig = {
  sections: [],
  conductClassificationColors: {},
};

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

describe("UsIdDisciplinaryFacilityNotesSection", () => {
  it("renders the note text when notes are present", () => {
    render(
      <UsIdDisciplinaryFacilityNotesSection
        caseDetail={makeCaseDetail({
          disciplinaryFacilityNotes:
            "Resident has been compliant this quarter.",
        })}
        config={CONFIG}
      />,
    );

    expect(
      screen.getByText("Resident has been compliant this quarter."),
    ).toBeInTheDocument();
  });

  it("renders an empty state when there are no notes", () => {
    render(
      <UsIdDisciplinaryFacilityNotesSection
        caseDetail={makeCaseDetail({ disciplinaryFacilityNotes: undefined })}
        config={CONFIG}
      />,
    );

    expect(
      screen.getByText("No facility notes on record."),
    ).toBeInTheDocument();
  });
});
