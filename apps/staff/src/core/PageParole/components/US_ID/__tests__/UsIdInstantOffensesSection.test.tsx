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

import { ParoleOffense } from "~datatypes";

import { UsIdInstantOffensesSection } from "../UsIdInstantOffensesSection";

function makeOffense(fields: Partial<ParoleOffense>): ParoleOffense {
  return {
    county: "Sangamon County",
    docket: "2021-CF-0489",
    conviction: "Armed Robbery",
    classFelony: "Class X Felony",
    sentence: "8 years",
    dateOfOffense: "2021-07-30",
    convictionDate: "2022-07-30",
    offenseNarrative: "Defendant entered convenience store with firearm.",
    ...fields,
  };
}

describe("UsIdInstantOffensesSection", () => {
  it("renders the conviction for each offense", () => {
    render(
      <UsIdInstantOffensesSection
        offenses={[
          makeOffense({ docket: "2021-CF-0489", conviction: "Armed Robbery" }),
          makeOffense({ docket: "2022-CF-0110", conviction: "Burglary" }),
        ]}
      />,
    );

    expect(screen.getByText("Armed Robbery")).toBeInTheDocument();
    expect(screen.getByText("Burglary")).toBeInTheDocument();
  });

  it("renders the section heading even with a single offense", () => {
    render(<UsIdInstantOffensesSection offenses={[makeOffense({})]} />);

    expect(screen.getByText("Instant Offenses")).toBeInTheDocument();
  });
});
