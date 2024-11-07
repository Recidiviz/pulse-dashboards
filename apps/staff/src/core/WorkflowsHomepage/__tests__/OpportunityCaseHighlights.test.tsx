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
import { addDays } from "date-fns";
import { shuffle } from "lodash";
import { BrowserRouter } from "react-router-dom";
import { Mock } from "vitest";

import { useRootStore } from "../../../components/StoreProvider";
import { Opportunity } from "../../../WorkflowsStore";
import { OpportunityCaseHighlights } from "../OpportunityCaseHighlights";

vi.mock("../../../components/StoreProvider");

function generateMockOpps(type: string, count: number): Opportunity[] {
  return Array.from(
    { length: count },
    (_, i) =>
      ({
        type,
        config: {
          highlightCasesOnHomepage: true,
          highlightedCaseCtaCopy: `${type} candidates`,
        },
        person: {
          externalId: `${i}`,
        },
        highlightCalloutText: `I am candidate ${i}`,
        eligibilityDate: addDays(new Date("2024-10-01"), i),
      }) as Opportunity,
  );
}

const mockUseRootStore = useRootStore as Mock;

describe("OpportunityCaseHighlights", () => {
  beforeEach(() => {
    mockUseRootStore.mockReturnValue({
      workflowsStore: {},
    });
  });

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
      <BrowserRouter>
        <OpportunityCaseHighlights
          opportunityTypes={["pastFTRD"]}
          opportunitiesByType={{
            pastFTRD: [mockOpp, mockOpp],
          }}
        />
      </BrowserRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders when opportunities with highlightCasesOnHomepage set are present", () => {
    render(
      <BrowserRouter>
        <OpportunityCaseHighlights
          opportunityTypes={["pastFTRD"]}
          opportunitiesByType={{
            pastFTRD: generateMockOpps("pastFTRD", 2),
          }}
        />
      </BrowserRouter>,
    );

    expect(
      screen.queryByText("Overdue for transition program release"),
    ).not.toBeEmptyDOMElement();
  });

  it("renders one entry for each highlighted candidate for small numbers", () => {
    render(
      <BrowserRouter>
        <OpportunityCaseHighlights
          opportunityTypes={["pastFTRD", "LSU"]}
          opportunitiesByType={{
            pastFTRD: generateMockOpps("pastFTRD", 2),
            LSU: generateMockOpps("LSU", 2),
          }}
        />
      </BrowserRouter>,
    );

    expect(
      screen.queryAllByText("I am candidate", { exact: false }),
    ).toHaveLength(4);
  });

  it("only renders candidates for the enables types", () => {
    render(
      <BrowserRouter>
        <OpportunityCaseHighlights
          opportunityTypes={["LSU"]}
          opportunitiesByType={{
            pastFTRD: generateMockOpps("pastFTRD", 2),
            LSU: generateMockOpps("LSU", 2),
          }}
        />
      </BrowserRouter>,
    );

    expect(
      screen.queryAllByText("I am candidate", { exact: false }),
    ).toHaveLength(2);
  });

  it("orders candidates by eligibility date", () => {
    render(
      <BrowserRouter>
        <OpportunityCaseHighlights
          opportunityTypes={["LSU"]}
          opportunitiesByType={{
            LSU: shuffle(generateMockOpps("LSU", 4)),
          }}
        />
      </BrowserRouter>,
    );

    const res = screen.queryAllByText("I am candidate", { exact: false });

    expect(res.map((r) => r.textContent)).toEqual(
      [0, 1, 2].map((i) => `I am candidate ${i}`),
    );
  });

  it("displays at most 3 candidates per opportunity", () => {
    render(
      <BrowserRouter>
        <OpportunityCaseHighlights
          opportunityTypes={["LSU", "pastFTRD", "earlyTermination"]}
          opportunitiesByType={{
            LSU: shuffle(generateMockOpps("LSU", 40)),
            pastFTRD: shuffle(generateMockOpps("pastFTRD", 40)),
            earlyTermination: shuffle(generateMockOpps("earlyTermination", 2)),
          }}
        />
      </BrowserRouter>,
    );

    expect(
      screen.queryAllByText("I am candidate", { exact: false }),
    ).toHaveLength(8);
  });

  it("separates candidates by opportunity", () => {
    render(
      <BrowserRouter>
        <OpportunityCaseHighlights
          opportunityTypes={["LSU", "pastFTRD", "earlyTermination"]}
          opportunitiesByType={{
            LSU: shuffle(generateMockOpps("LSU", 40)),
            pastFTRD: shuffle(generateMockOpps("pastFTRD", 40)),
            earlyTermination: shuffle(generateMockOpps("earlyTermination", 2)),
          }}
        />
      </BrowserRouter>,
    );

    const res = screen.queryAllByText("I am candidate", { exact: false });

    expect(res.map((r) => r.textContent)).toEqual(
      [0, 1, 2, 0, 1, 2, 0, 1].map((i) => `I am candidate ${i}`),
    );
  });

  it("renders links to all candidates when more than 3 candidates for a single opportunity", () => {
    render(
      <BrowserRouter>
        <OpportunityCaseHighlights
          opportunityTypes={["LSU", "pastFTRD", "earlyTermination"]}
          opportunitiesByType={{
            LSU: shuffle(generateMockOpps("LSU", 40)),
            pastFTRD: shuffle(generateMockOpps("pastFTRD", 40)),
            earlyTermination: shuffle(generateMockOpps("earlyTermination", 2)),
          }}
        />
      </BrowserRouter>,
    );

    expect(screen.queryByText("See all 40 LSU candidates")).not.toBeNull();
    expect(screen.queryByText("See all 40 pastFTRD candidates")).not.toBeNull();
    expect(screen.queryByText("earlyTermination", { exact: false })).toBeNull();
  });
});
