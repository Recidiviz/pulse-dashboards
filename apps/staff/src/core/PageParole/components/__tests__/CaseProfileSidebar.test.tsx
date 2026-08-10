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

import { CaseProfileSidebar } from "../CaseProfileSidebar";
import { ParoleSectionName } from "../ParoleSectionComponents";
import { PAROLE_SECTION_IDS } from "../shared";

const REQUIRED_PROPS = {
  name: "Anderson, Michael",
  docId: "DOC-45821",
  custodyLevel: "Minimum",
  gender: "Male",
  dob: "1986-07-27",
  hearingDate: "2026-08-01",
  currentFacility: "Central State Correctional Facility",
  caseManagerName: "Jennifer Martinez",
  sentenceStartDate: "2022-07-27",
  paroleEligibilityDate: "2026-08-16",
  mandatoryReleaseDate: "2028-06-26",
  isParoleReturn: false,
};

// Renders each section's PAROLE_SECTION_IDS target alongside the sidebar, the
// same way ParoleCaseProfile's real MainColumn does, so scrollIntoView calls
// can be matched back to a specific section by element identity.
function renderSidebar(sections: Array<ParoleSectionName>) {
  return render(
    <>
      <CaseProfileSidebar {...REQUIRED_PROPS} sections={sections} />
      {sections.map((sectionName) => (
        <div key={sectionName} id={PAROLE_SECTION_IDS[sectionName]} />
      ))}
    </>,
  );
}

describe("CaseProfileSidebar", () => {
  // jsdom doesn't implement scrollIntoView, so the nav's click handler would
  // throw without a stub. Assigning our own mock also lets these tests
  // assert which element it was called on.
  const scrollIntoViewMock = vi.fn();

  beforeEach(() => {
    scrollIntoViewMock.mockClear();
    Element.prototype.scrollIntoView = scrollIntoViewMock;
  });

  afterAll(() => {
    Reflect.deleteProperty(Element.prototype, "scrollIntoView");
  });

  it("does not render the parole return banner by default", () => {
    renderSidebar(["attachments"]);

    expect(screen.queryByText("Parole Return")).not.toBeInTheDocument();
  });

  it("renders the parole return banner when isParoleReturn is true", () => {
    render(
      <CaseProfileSidebar
        {...REQUIRED_PROPS}
        isParoleReturn
        sections={["attachments"]}
      />,
    );

    expect(screen.getByText("Parole Return")).toBeInTheDocument();
  });

  it("renders the nav from the sections prop, not a fixed list", () => {
    renderSidebar(["attachments", "riskAssessment"]);

    expect(
      screen.getByRole("button", { name: "Attachments" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Risk Score Trajectory" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Offense & Criminal History" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Program Participation" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Institutional Conduct History",
      }),
    ).not.toBeInTheDocument();
  });

  it("orders the nav to match the sections prop, not a fixed list", () => {
    renderSidebar(["attachments", "riskAssessment"]);

    const buttons = screen.getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual([
      "Attachments",
      "Risk Score Trajectory",
    ]);
  });

  it("scrolls to the section matching a given tenant's configured id, not a fixed one", async () => {
    const user = userEvent.setup();
    renderSidebar(["attachments"]);

    await user.click(screen.getByRole("button", { name: "Attachments" }));

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewMock.mock.instances[0]).toBe(
      document.getElementById(PAROLE_SECTION_IDS.attachments),
    );
  });
});
