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

import { PAROLE_UNKNOWN_DATE, ParoleCase } from "~datatypes";

import {
  ParolePersonalDetails,
  ParoleSentenceInfo,
} from "../ParoleGeneralInfo";

function makeCaseDetail(fields: Partial<ParoleCase>): ParoleCase {
  return {
    docId: "45821",
    name: "Anderson, Michael",
    dob: "1985-03-14",
    gender: "MALE",
    currentFacility: "Facility A",
    custodyLevel: "Minimum",
    caseManagerName: "Not yet available",
    hearingType: "Parole Grant Hearing",
    sentenceStartDate: "2020-01-01",
    paroleEligibilityDate: "2026-01-01",
    mandatoryReleaseDate: "2030-01-01",
    parolePlan: { onFile: false, documents: [] },
    attachments: [],
    conductHistory: [],
    communitySupervisionPlan: [],
    docPrograms: [],
    edovoPrograms: [],
    offenseHistory: {
      offenses: [
        {
          county: "Not yet available",
          docket: "Not yet available",
          conviction: "Not yet available",
          classFelony: "Not yet available",
          sentence: "Not yet available",
          dateOfOffense: "9999-12-01",
          convictionDate: "9999-12-01",
          offenseNarrative: "Not yet available",
        },
      ],
      priorConvictions: [],
      victimInvolved: false,
      victimAttendingHearing: false,
    },
    riskAssessments: [],
    riskAndNeedsFactors: [],
    ...fields,
  };
}

describe("ParolePersonalDetails", () => {
  it("renders age and DOB for a resident with a real date of birth", () => {
    render(
      <ParolePersonalDetails
        caseDetail={makeCaseDetail({ dob: "1985-03-14" })}
      />,
    );

    // Age depends on today's date, so just confirm no placeholder leaked in
    // and the formatted DOB rendered.
    expect(screen.getByText("Mar 14, 1985")).toBeInTheDocument();
    expect(screen.queryByText("Not yet available")).not.toBeInTheDocument();
  });

  it("shows a placeholder instead of a negative age when dob is the unknown-date sentinel", () => {
    render(
      <ParolePersonalDetails
        caseDetail={makeCaseDetail({ dob: PAROLE_UNKNOWN_DATE })}
      />,
    );

    expect(screen.getAllByText("Not yet available")).toHaveLength(2);
  });
});

describe("ParoleSentenceInfo", () => {
  it("renders real sentence dates for a resident with known dates", () => {
    render(
      <ParoleSentenceInfo
        caseDetail={makeCaseDetail({
          sentenceStartDate: "2020-01-01",
          paroleEligibilityDate: "2026-01-01",
          mandatoryReleaseDate: "2030-01-01",
        })}
      />,
    );

    expect(screen.getByText("Jan 1, 2020")).toBeInTheDocument();
    expect(screen.getByText("Jan 1, 2026")).toBeInTheDocument();
    expect(screen.getByText("Jan 1, 2030")).toBeInTheDocument();
    expect(screen.queryByText("Not yet available")).not.toBeInTheDocument();
  });

  it("shows a placeholder instead of the unknown-date sentinel for each sentence date", () => {
    render(
      <ParoleSentenceInfo
        caseDetail={makeCaseDetail({
          sentenceStartDate: PAROLE_UNKNOWN_DATE,
          paroleEligibilityDate: PAROLE_UNKNOWN_DATE,
          mandatoryReleaseDate: PAROLE_UNKNOWN_DATE,
        })}
      />,
    );

    expect(screen.getAllByText("Not yet available")).toHaveLength(3);
  });
});
