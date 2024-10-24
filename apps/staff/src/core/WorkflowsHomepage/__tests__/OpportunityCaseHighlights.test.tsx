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

import { Opportunity } from "../../../WorkflowsStore";
import { OpportunityCaseHighlights } from "../OpportunityCaseHighlights";

describe("OpportunityCaseHighlights", () => {
  it("does not render when no opportunities present", () => {
    const { container } = render(
      <OpportunityCaseHighlights
        opportunityTypes={[]}
        opportunitiesByType={{}}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("does not render when selected opportunities are not present", () => {
    const { container } = render(
      <OpportunityCaseHighlights
        opportunityTypes={["LSU"]}
        opportunitiesByType={{
          pastFTRD: [{} as Opportunity, {} as Opportunity],
        }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("does not render when no opportunities have highlightCasesOnHomepage set", () => {
    const mockOpp = {
      config: {
        highlightCasesOnHomepage: false,
      },
    } as Opportunity;
    const { container } = render(
      <OpportunityCaseHighlights
        opportunityTypes={["pastFTRD"]}
        opportunitiesByType={{
          pastFTRD: [mockOpp, mockOpp],
        }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders when opportunities with highlightCasesOnHomepage set are present", () => {
    const mockOpp = {
      config: {
        highlightCasesOnHomepage: true,
      },
    } as Opportunity;

    render(
      <OpportunityCaseHighlights
        opportunityTypes={["pastFTRD"]}
        opportunitiesByType={{
          pastFTRD: [mockOpp, mockOpp],
        }}
      />,
    );

    expect(
      screen.queryByText("Overdue for transition program release"),
    ).not.toBeEmptyDOMElement();
  });
});
