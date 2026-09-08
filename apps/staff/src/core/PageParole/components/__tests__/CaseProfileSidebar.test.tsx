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

import { ParoleConfig } from "../../../models/types";
import { CaseProfileSidebar } from "../CaseProfileSidebar";
import { ParoleSectionName } from "../ParoleSectionComponents";
import { PAROLE_SECTION_IDS } from "../shared";

// A US_CO case, so the sidebar renders the DefaultParoleGeneralInfo layout
// (no tenant sidebarComponent override). Anderson has isParoleReturn: false.
const CASE = paroleCasesFixtureByState.US_CO["45821"];

function configWith(sections: Array<ParoleSectionName>): ParoleConfig {
  return { sections, conductHistory: { classificationColors: {} } };
}

// The pieces of a piped FactLabel (e.g. "Incarcerated | Minimum") render as
// separate text nodes, so a plain getByText against one node never sees the
// whole string. Match on the closest ancestor's textContent instead.
function getByTextAcrossElements(text: string) {
  return screen.getByText((_, element) => {
    const elementHasText = element?.textContent === text;
    const childrenDontHaveText = Array.from(element?.children ?? []).every(
      (child) => child.textContent !== text,
    );
    return Boolean(elementHasText && childrenDontHaveText);
  });
}

const SLOT_MARKER = "tenant slot marker";

// Renders each section's PAROLE_SECTION_IDS target alongside the sidebar, the
// same way ParoleCaseProfile's real MainColumn does, so scrollIntoView calls
// can be matched back to a specific section by element identity.
function renderSidebar(sections: Array<ParoleSectionName>) {
  return render(
    <>
      <CaseProfileSidebar caseDetail={CASE} config={configWith(sections)} />
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

  it("renders the default sidebar body when no sidebarComponent is configured", () => {
    renderSidebar(["attachments"]);

    expect(
      getByTextAcrossElements(`Incarcerated | ${CASE.custodyLevel}`),
    ).toBeInTheDocument();
    // Facility lives inside Hearing Info in the default layout.
    expect(screen.getByText("Facility")).toBeInTheDocument();
    expect(screen.getByText(CASE.currentFacility)).toBeInTheDocument();
    expect(screen.getByText("Personal Details")).toBeInTheDocument();
    expect(screen.getByText("Sentence Info")).toBeInTheDocument();
  });

  it("renders a tenant's sidebarComponent in place of the default", () => {
    render(
      <CaseProfileSidebar
        caseDetail={CASE}
        config={{
          ...configWith(["attachments"]),
          sidebarComponent: () => <div>{SLOT_MARKER}</div>,
        }}
      />,
    );

    expect(screen.getByText(SLOT_MARKER)).toBeInTheDocument();
    // The default layout's own content must not render alongside the override.
    expect(screen.queryByText("Personal Details")).not.toBeInTheDocument();
  });

  it("does not render the parole return banner by default", () => {
    renderSidebar(["attachments"]);

    expect(screen.queryByText("Parole Return")).not.toBeInTheDocument();
  });

  it("renders the parole return banner when isParoleReturn is true", () => {
    render(
      <CaseProfileSidebar
        caseDetail={{ ...CASE, isParoleReturn: true }}
        config={configWith(["attachments"])}
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

  it("labels the conduct-history nav from the tenant's conductHistory.title override", () => {
    render(
      <CaseProfileSidebar
        caseDetail={CASE}
        config={{
          ...configWith(["conductHistory"]),
          conductHistory: {
            classificationColors: {},
            title: "Institutional & Community Behavior",
          },
        }}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Institutional & Community Behavior",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Institutional Conduct History",
      }),
    ).not.toBeInTheDocument();
  });

  it("labels the offense nav from the tenant's offenseHistoryTitle override", () => {
    render(
      <CaseProfileSidebar
        caseDetail={CASE}
        config={{
          ...configWith(["offenseHistory"]),
          offenseHistoryTitle: "Criminal & Parole History",
        }}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Criminal & Parole History" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Offense & Criminal History" }),
    ).not.toBeInTheDocument();
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
