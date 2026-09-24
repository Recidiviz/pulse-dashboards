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

import { UsIdOffenseHistorySection } from "../UsIdOffenseHistorySection";

// A fully-valid US_ID ParoleCase to base test cases on, so we only have to
// override the offenses under test rather than reconstruct the whole case.
const baseCase = Object.values(paroleCasesFixtureByState.US_ID)[0];

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
    sentenceStartDate: "2020-01-15",
    paroleEligibilityDate: "2026-03-01",
    fullTermDate: "2029-12-08",
    indeterminateStartDate: "2026-06-01",
    indeterminateEndDateInclusive: "2029-12-07",
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
  return render(<UsIdOffenseHistorySection caseDetail={caseDetail} />);
}

describe("UsIdOffenseHistorySection", () => {
  it("renders the Offense Information header", () => {
    renderSection(caseWithOffenses(makeOffense({})));

    expect(screen.getByText("Offense Information")).toBeInTheDocument();
    expect(screen.getByText("Instant Offenses")).toBeInTheDocument();
  });

  it("shows each offense's name, statute, and case number", () => {
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

    expect(screen.getByText("Robbery")).toBeInTheDocument();
    expect(screen.getByText("Escape")).toBeInTheDocument();
    expect(screen.getByText("§18-6501")).toBeInTheDocument();
    expect(screen.getByText("§18-2505")).toBeInTheDocument();
    expect(screen.getByText("Case # CR25-08-1142")).toBeInTheDocument();
    expect(screen.getByText("Case # CR25-11-0877")).toBeInTheDocument();
  });

  it("renders the four sentencing facts with formatted dates", () => {
    renderSection(caseWithOffenses(makeOffense({})));

    expect(screen.getByText("Parole Elig.")).toBeInTheDocument();
    expect(screen.getByText("March 1, 2026")).toBeInTheDocument();
    expect(screen.getByText("Full Term")).toBeInTheDocument();
    expect(screen.getByText("December 8, 2029")).toBeInTheDocument();
  });

  it("ranges the sentence from its start to full term", () => {
    renderSection(caseWithOffenses(makeOffense({})));

    expect(screen.getByText("Sent. Length")).toBeInTheDocument();
    expect(screen.getByText("1/15/2020 - 12/8/2029")).toBeInTheDocument();
  });

  it("ranges the indeterminate half by Atlas's own bounds, not parole eligibility", () => {
    renderSection(caseWithOffenses(makeOffense({})));

    expect(screen.getByText("Indeterm. Length")).toBeInTheDocument();
    expect(screen.getByText("6/1/2026 - 12/7/2029")).toBeInTheDocument();
    // The old derivation would have started this at the parole eligibility
    // date and ended it on full term.
    expect(screen.queryByText("3/1/2026 - 12/8/2029")).not.toBeInTheDocument();
  });

  it("shows a placeholder when the sentence has no indeterminate portion", () => {
    renderSection(
      caseWithOffenses(
        makeOffense({
          indeterminateStartDate: undefined,
          indeterminateEndDateInclusive: undefined,
        }),
      ),
    );

    expect(screen.getByText("1/15/2020 - 12/8/2029")).toBeInTheDocument();
    expect(screen.getAllByText("----")).toHaveLength(1);
  });

  it("drops the facts the V1 design removed", () => {
    renderSection(caseWithOffenses(makeOffense({})));

    expect(screen.queryByText("Sentencing")).not.toBeInTheDocument();
    expect(screen.queryByText("Sentence")).not.toBeInTheDocument();
    expect(screen.queryByText("Fixed Length")).not.toBeInTheDocument();
  });

  it("keeps the indeterminate range when the sentence's own bounds are missing", () => {
    renderSection(
      caseWithOffenses(
        makeOffense({ sentenceStartDate: undefined, fullTermDate: undefined }),
      ),
    );

    // Full Term and Sent. Length both lose a bound; the indeterminate range
    // has its own dates and is unaffected.
    expect(screen.getAllByText("----")).toHaveLength(2);
    expect(screen.getByText("6/1/2026 - 12/7/2029")).toBeInTheDocument();
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

    expect(screen.queryByText("Victim Enrolled")).not.toBeInTheDocument();
    expect(screen.queryByText("Prior Convictions")).not.toBeInTheDocument();
  });

  it("names Life rather than dashes for a sentence with no end", () => {
    renderSection(
      caseWithOffenses(
        makeOffense({
          isLife: true,
          fullTermDate: undefined,
          indeterminateEndDateInclusive: undefined,
        }),
      ),
    );

    // Full Term stands alone; the two spans still show when they began.
    expect(screen.getByText("Life")).toBeInTheDocument();
    expect(screen.getAllByText("1/15/2020 - Life")).toHaveLength(1);
    expect(screen.getByText("6/1/2026 - Life")).toBeInTheDocument();
    expect(screen.queryByText("----")).not.toBeInTheDocument();
  });

  it("still dashes a life sentence's span when its start is missing", () => {
    renderSection(
      caseWithOffenses(
        makeOffense({
          isLife: true,
          sentenceStartDate: undefined,
          fullTermDate: undefined,
          indeterminateStartDate: undefined,
          indeterminateEndDateInclusive: undefined,
        }),
      ),
    );

    expect(screen.getByText("Life")).toBeInTheDocument();
    expect(screen.getAllByText("----")).toHaveLength(2);
  });
});
