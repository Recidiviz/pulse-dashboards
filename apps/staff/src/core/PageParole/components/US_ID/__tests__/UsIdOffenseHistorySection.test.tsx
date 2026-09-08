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

import {
  ParoleCase,
  paroleCasesFixtureByState,
  ParoleOffense,
} from "~datatypes";

import type { ParoleConfig } from "../../../../models/types";
import { UsIdOffenseHistorySection } from "../UsIdOffenseHistorySection";

// A fully-valid US_ID ParoleCase to base test cases on, so we only have to
// override the offenses under test rather than reconstruct the whole case.
const baseCase = Object.values(paroleCasesFixtureByState.US_ID)[0];

const CONFIG: ParoleConfig = {
  sections: [],
  conductHistory: { classificationColors: {} },
  offenseHistoryTitle: "Criminal & Parole History",
};

function makeOffense(fields: Partial<ParoleOffense>): ParoleOffense {
  return {
    county: "Ada County",
    docket: "CR25-08-1142",
    conviction: "Robbery",
    classFelony: "Felony",
    sentence: "10 years DOC",
    dateOfOffense: "2019-06-01",
    convictionDate: "2020-01-15",
    offenseNarrative: "",
    statute: "18-6501",
    sentencingDate: "2020-01-15",
    paroleEligibilityDate: "2026-03-01",
    fullTermDate: "2029-12-08",
    fixedLength: "3 years",
    indeterminateLength: "7 years",
    ...fields,
  };
}

function caseWithOffenses(
  first: ParoleOffense,
  ...rest: ParoleOffense[]
): ParoleCase {
  return {
    ...baseCase,
    offenseHistory: {
      ...baseCase.offenseHistory,
      offenses: [first, ...rest],
    },
  };
}

function renderSection(caseDetail: ParoleCase) {
  return render(
    <UsIdOffenseHistorySection caseDetail={caseDetail} config={CONFIG} />,
  );
}

describe("UsIdOffenseHistorySection", () => {
  it("renders the Criminal & Parole History header", () => {
    renderSection(caseWithOffenses(makeOffense({})));

    expect(screen.getByText("Criminal & Parole History")).toBeInTheDocument();
    expect(screen.getByText("Instant Offenses")).toBeInTheDocument();
  });

  it("numbers each offense and shows its name, statute, and case number", () => {
    renderSection(
      caseWithOffenses(
        makeOffense({
          conviction: "Robbery",
          statute: "18-6501",
          docket: "CR25-08-1142",
        }),
        makeOffense({
          conviction: "Escape",
          statute: "18-2505",
          docket: "CR25-11-0877",
        }),
      ),
    );

    expect(screen.getByText(/1\. Robbery/)).toBeInTheDocument();
    expect(screen.getByText(/2\. Escape/)).toBeInTheDocument();
    expect(screen.getByText("§18-6501")).toBeInTheDocument();
    expect(screen.getByText("§18-2505")).toBeInTheDocument();
    expect(screen.getByText("Case # CR25-08-1142")).toBeInTheDocument();
    expect(screen.getByText("Case # CR25-11-0877")).toBeInTheDocument();
  });

  it("renders the sentencing facts with formatted dates", () => {
    renderSection(
      caseWithOffenses(
        makeOffense({ sentencingDate: "2020-01-15", sentence: "10 years DOC" }),
      ),
    );

    expect(screen.getByText("Sentencing")).toBeInTheDocument();
    expect(screen.getByText("Jan 15, 2020")).toBeInTheDocument();
    expect(screen.getByText("Sentence")).toBeInTheDocument();
    expect(screen.getByText("10 years DOC")).toBeInTheDocument();
    expect(screen.getByText("Parole elig.")).toBeInTheDocument();
    expect(screen.getByText("Full term")).toBeInTheDocument();
    expect(screen.getByText("Fixed Length")).toBeInTheDocument();
    expect(screen.getByText("Indeterm. Length")).toBeInTheDocument();
  });

  it("shows a placeholder for a missing fixed and indeterminate length", () => {
    renderSection(
      caseWithOffenses(
        makeOffense({ fixedLength: undefined, indeterminateLength: undefined }),
      ),
    );

    expect(screen.getAllByText("----")).toHaveLength(2);
  });

  it("does not render victim banners or prior convictions", () => {
    renderSection({
      ...baseCase,
      offenseHistory: {
        ...baseCase.offenseHistory,
        offenses: [makeOffense({})],
        victimInvolved: true,
        victimAttendingHearing: true,
        priorConvictions: [{ charge: "Theft", date: "2015-01-01" }],
      },
    });

    expect(
      screen.queryByText("Victim involved in current offense"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Prior Convictions")).not.toBeInTheDocument();
  });
});
