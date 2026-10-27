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

import { useFeatureVariants } from "../../../../components/StoreProvider";
import { Opportunity } from "../../../../WorkflowsStore";
import { UsIaEarlyDischargeOpportunity } from "../../../../WorkflowsStore/Opportunity/UsIa";
import { UsIaEarlyDischargeFormStatus } from "../US_IA/UsIaEarlyDischargeFormStatus";

vi.mock("../../../../components/StoreProvider", () => ({
  useFeatureVariants: vi.fn(),
}));
const useFeatureVariantsMock = vi.mocked(useFeatureVariants);

// Object.create gives an instance that passes the component's instanceof
// check without running the opportunity's constructor.
const earlyDischargeOpportunity = Object.create(
  UsIaEarlyDischargeOpportunity.prototype,
) as UsIaEarlyDischargeOpportunity;

describe("UsIaEarlyDischargeFormStatus", () => {
  it("renders nothing without the usIaEarlyDischargeV2 variant", () => {
    useFeatureVariantsMock.mockReturnValue({});

    const { container } = render(
      <UsIaEarlyDischargeFormStatus opportunity={earlyDischargeOpportunity} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for an opportunity other than US_IA early discharge", () => {
    useFeatureVariantsMock.mockReturnValue({ usIaEarlyDischargeV2: {} });

    const { container } = render(
      <UsIaEarlyDischargeFormStatus
        opportunity={{ type: "usIaEarlyDischarge" } as Opportunity}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the heading and empty state with the variant", () => {
    useFeatureVariantsMock.mockReturnValue({ usIaEarlyDischargeV2: {} });

    render(
      <UsIaEarlyDischargeFormStatus opportunity={earlyDischargeOpportunity} />,
    );

    expect(screen.getByText("Form submission status")).toBeInTheDocument();
    expect(screen.getByText("Nothing submitted yet")).toBeInTheDocument();
  });
});
