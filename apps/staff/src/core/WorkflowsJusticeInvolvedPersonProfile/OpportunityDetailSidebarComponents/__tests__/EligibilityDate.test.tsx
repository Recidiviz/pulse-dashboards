// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { OpportunityType } from "~datatypes";

import { Opportunity } from "../../../../WorkflowsStore";
import { OpportunityProfileProps } from "../../types";
import { EligibilityDate } from "../EligibilityDate";

// somewhere this is being called as a side effect and blowing up.
// It's not really related to this component at all
vi.mock("../../../../components/StoreProvider", () => ({}));
const testOppType = "usXxTestOpp" as OpportunityType;

describe("EligibilityDate sidebar component tests", () => {
  it("does not display if no eligibilityDate field is set on the opportunity", () => {
    const testOpp = {
      type: testOppType,
      config: {},
    } as Opportunity;

    const props = { opportunity: testOpp } as OpportunityProfileProps;

    render(<EligibilityDate {...props} />);

    expect(screen.queryByText("Eligibility Date")).toBeNull();
  });

  it("displays fallback text if eligibilityDateText is not set on config", () => {
    const testOpp = {
      type: testOppType,
      eligibilityDate: new Date(2022, 1, 3),
      config: {},
    } as Opportunity;

    const props = { opportunity: testOpp } as OpportunityProfileProps;

    render(<EligibilityDate {...props} />);

    expect(
      screen.queryByText("First Day of Eligibility", { exact: false }),
    ).toBeInTheDocument();
  });

  it("displays eligibilityDateText when set on config", () => {
    const testOpp = {
      type: testOppType,
      eligibilityDate: new Date(2022, 1, 3),
      config: { eligibilityDateText: "The cow goes oink" },
    } as Opportunity;

    const props = { opportunity: testOpp } as OpportunityProfileProps;

    render(<EligibilityDate {...props} />);

    expect(
      screen.queryByText("The cow goes oink", { exact: false }),
    ).toBeInTheDocument();
  });
});
