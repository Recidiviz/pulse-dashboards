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

import { paroleCasesFixtureByState } from "~datatypes";

import {
  CaseProfileSidebar,
  ParoleSectionNavItem,
} from "../CaseProfileSidebar";

// A US_CO case. Anderson has isParoleReturn: false.
const CASE = paroleCasesFixtureByState.US_CO["45821"];

const BODY_MARKER = "sidebar body marker";

// Deliberately not real PAROLE_SECTION_IDS entries: the sidebar renders
// whatever nav items it is handed, so a test that passes real ids could not
// tell a generic nav apart from a hardcoded one.
const NAV_ITEMS: ReadonlyArray<ParoleSectionNavItem> = [
  { id: "section-alpha", label: "Alpha Section" },
  { id: "section-beta", label: "Beta Section" },
];

// Renders each nav entry's target element alongside the sidebar, the same way
// a tenant's case profile does, so scrollIntoView calls can be matched back to
// a specific section by element identity.
function renderSidebar(
  sections: ReadonlyArray<ParoleSectionNavItem> = NAV_ITEMS,
) {
  return render(
    <>
      <CaseProfileSidebar caseDetail={CASE} sections={sections}>
        <div>{BODY_MARKER}</div>
      </CaseProfileSidebar>
      {sections.map((section) => (
        <div key={section.id} id={section.id} />
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

  it("renders its children as the info card body", () => {
    renderSidebar();

    expect(screen.getByText(BODY_MARKER)).toBeInTheDocument();
  });

  it("does not render the parole return banner by default", () => {
    renderSidebar();

    expect(screen.queryByText("Parole Return")).not.toBeInTheDocument();
  });

  it("renders the parole return banner when isParoleReturn is true", () => {
    render(
      <CaseProfileSidebar
        caseDetail={{ ...CASE, isParoleReturn: true }}
        sections={NAV_ITEMS}
      >
        <div>{BODY_MARKER}</div>
      </CaseProfileSidebar>,
    );

    expect(screen.getByText("Parole Return")).toBeInTheDocument();
  });

  it("renders one nav button per section, in the order given", () => {
    renderSidebar();

    expect(
      screen.getAllByRole("button").map((button) => button.textContent),
    ).toEqual(["Alpha Section", "Beta Section"]);
  });

  it("scrolls to the element whose id matches the clicked nav entry", async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole("button", { name: "Beta Section" }));

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewMock.mock.instances[0]).toBe(
      document.getElementById("section-beta"),
    );
  });
});
