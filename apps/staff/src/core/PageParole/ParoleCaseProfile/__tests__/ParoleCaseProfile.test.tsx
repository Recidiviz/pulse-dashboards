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

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format, subYears } from "date-fns";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import * as StoreProvider from "../../../../components/StoreProvider";
import { ParoleStore } from "../../../../ParoleStore/ParoleStore";
import { RootStore } from "../../../../RootStore";
import { PAROLE_SECTION_IDS } from "../../components/shared";
import { ParoleCaseProfile } from "../ParoleCaseProfile";

vi.mock("../../../../components/StoreProvider");

const useRootStoreMock = vi.mocked(StoreProvider.useRootStore);

let rootStore: RootStore;

beforeEach(() => {
  rootStore = new RootStore();
  rootStore.tenantStore.currentTenantId = "US_CO";
  const paroleStore = new ParoleStore(rootStore);
  // mockImplementation (not mockReturnValue) so each call reads the current
  // currentTenantId live -- needed to simulate a tenant switch mid-test
  // without navigating to a new route.
  useRootStoreMock.mockImplementation(
    () =>
      ({
        paroleStore,
        currentTenantId: rootStore.tenantStore.currentTenantId,
      }) as never,
  );
});

// The label and value in rows like "Total Violations: 6" are separate
// elements (the value is wrapped in a FactLabel span), so the default
// getByText match against a single node's own text never sees the full
// string. Match on textContent of the closest common ancestor instead,
// inspired by https://stackoverflow.com/a/68429756
function getByTextAcrossElements(text: string) {
  return screen.getByText((_, element) => {
    const elementHasText = element?.textContent === text;
    const childrenDontHaveText = Array.from(element?.children ?? []).every(
      (child) => child.textContent !== text,
    );
    return Boolean(elementHasText && childrenDontHaveText);
  });
}

// CaseProfileSidebar's "jump to section" nav repeats each section's heading
// text in its own button (e.g. "Attachments" appears as both a nav button and
// the section's SectionCardHeader), so a plain findByText/getByText match is
// ambiguous. Scope the match to non-button elements to get the section
// heading specifically.
function findSectionHeading(text: string) {
  return screen.findByText(
    (content, element) => content === text && element?.tagName !== "BUTTON",
  );
}

function renderAtPath(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/parole/case/:docId" element={<ParoleCaseProfile />} />
        <Route path="*" element={<ParoleCaseProfile />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ParoleCaseProfile", () => {
  it("renders a link back to the docket", async () => {
    renderAtPath("/parole/case/DOC-45821");

    const link = await screen.findByRole("link", { name: /back to docket/i });
    expect(link).toHaveAttribute("href", "/parole/docket");
  });

  it("renders NotFound when there is no docId in the route", () => {
    renderAtPath("/parole/case-missing-param");

    expect(screen.getByText("Oops Page Not Found")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /back to docket/i }),
    ).not.toBeInTheDocument();
  });

  describe("the identity/hearing info section", () => {
    it("renders the individual's identity, personal, hearing, and sentence info", async () => {
      renderAtPath("/parole/case/DOC-45821");

      expect(await screen.findByText("Anderson, Michael")).toBeInTheDocument();
      expect(screen.getByText("DOC-45821")).toBeInTheDocument();
      expect(
        getByTextAcrossElements("Incarcerated | Minimum"),
      ).toBeInTheDocument();
      expect(screen.getByText("Personal Details")).toBeInTheDocument();
      expect(screen.getByText("Male")).toBeInTheDocument();
      // Anderson's dob is exactly 40 years before "today" in the fixture, so
      // the computed age is stable regardless of which day the test runs.
      expect(screen.getByText("40")).toBeInTheDocument();
      expect(screen.getByText("Hearing Info")).toBeInTheDocument();
      expect(
        screen.getByText("Central State Correctional Facility"),
      ).toBeInTheDocument();
      expect(screen.getByText("Jennifer Martinez")).toBeInTheDocument();
      expect(screen.getByText("Sentence Info")).toBeInTheDocument();
      expect(
        screen.getByText("Parole Eligibility Date (PED)"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Mandatory Release Date (MRD)"),
      ).toBeInTheDocument();
    });

    it("renders the upcoming hearing date when a hearing is scheduled", async () => {
      renderAtPath("/parole/case/DOC-45821");

      expect(await screen.findByText("Hearing Date")).toBeInTheDocument();
      // The fixture's hearing date is relative to "today", so only assert
      // that a real date rendered in place of the "Not scheduled" fallback.
      expect(screen.queryByText("Not scheduled")).not.toBeInTheDocument();
    });

    it("renders 'Not scheduled' as the hearing date when there is no upcoming hearing", async () => {
      renderAtPath("/parole/case/DOC-59402");

      expect(await screen.findByText("Harris, Patricia")).toBeInTheDocument();
      expect(screen.getByText("Not scheduled")).toBeInTheDocument();
    });
  });

  describe("the section quick-nav", () => {
    // jsdom doesn't implement scrollIntoView, so CaseProfileSidebar's click
    // handler would throw without a stub. Assigning our own mock also lets
    // these tests assert which element it was called on.
    const scrollIntoViewMock = vi.fn();

    beforeEach(() => {
      scrollIntoViewMock.mockClear();
      Element.prototype.scrollIntoView = scrollIntoViewMock;
    });

    afterAll(() => {
      Reflect.deleteProperty(Element.prototype, "scrollIntoView");
    });

    // Order matches CaseProfileSidebar's SECTION_NAV_ITEMS, which is meant to
    // match the MainColumn section render order (see OBT-42664).
    const NAV_ITEMS: ReadonlyArray<[label: string, sectionId: string]> = [
      ["Offense & Criminal History", PAROLE_SECTION_IDS.offenseHistory],
      ["Risk Score Trajectory", PAROLE_SECTION_IDS.riskAssessment],
      ["Program Participation", PAROLE_SECTION_IDS.programParticipation],
      ["Institutional Conduct History", PAROLE_SECTION_IDS.conductHistory],
      ["Attachments", PAROLE_SECTION_IDS.attachments],
    ];

    it.each(NAV_ITEMS)(
      "scrolls to the %s section when its quick-nav item is clicked",
      async (label, sectionId) => {
        const user = userEvent.setup();
        renderAtPath("/parole/case/DOC-45821");

        await findSectionHeading(label);
        await user.click(screen.getByRole("button", { name: label }));

        expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
        expect(scrollIntoViewMock.mock.instances[0]).toBe(
          document.getElementById(sectionId),
        );
      },
    );
  });

  describe("the attachments section", () => {
    it("merges the parole plan documents and attachments into one newest-to-oldest list", async () => {
      renderAtPath("/parole/case/DOC-45821");

      expect(await findSectionHeading("Attachments")).toBeInTheDocument();

      // Matches only each row's name (e.g. "Letter of Support - Rev. Thomas
      // Mills"), not its detail label (e.g. "Uploaded: Jul 8, 2026").
      const rowNames = screen
        .getAllByText(
          (content) =>
            content === "Parole Plan" ||
            content.startsWith("Letter of Support - ") ||
            content === "Victim Impact Statement",
        )
        .map((el) => el.textContent);
      expect(rowNames).toEqual([
        "Parole Plan",
        "Letter of Support - Rev. Thomas Mills",
        "Letter of Support - Mary Anderson (Sister)",
        "Parole Plan",
        "Victim Impact Statement",
      ]);

      const viewLinks = screen.getAllByRole("link", { name: /view/i });
      expect(viewLinks).toHaveLength(5);
      viewLinks.forEach((link) => expect(link).toHaveAttribute("download"));
    });

    it("renders a banner when no parole plan is on file", async () => {
      renderAtPath("/parole/case/DOC-61247");

      expect(
        await screen.findByText("NO PAROLE PLAN ON FILE"),
      ).toBeInTheDocument();
    });

    it("renders a banner when the parole plan hasn't been updated in over 90 days", async () => {
      renderAtPath("/parole/case/DOC-52903");

      expect(
        await screen.findByText("PAROLE PLAN NOT RECENTLY UPDATED"),
      ).toBeInTheDocument();
    });

    it("renders neither banner when the parole plan is on file and current", async () => {
      renderAtPath("/parole/case/DOC-45821");

      await findSectionHeading("Attachments");
      expect(
        screen.queryByText("NO PAROLE PLAN ON FILE"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("PAROLE PLAN NOT RECENTLY UPDATED"),
      ).not.toBeInTheDocument();
    });
  });

  describe("the conduct history section", () => {
    it("renders the violation summary and the most recent record", async () => {
      renderAtPath("/parole/case/DOC-45821");

      expect(
        await findSectionHeading("Institutional Conduct History"),
      ).toBeInTheDocument();
      // These counts are stable regardless of the current date -- they only
      // depend on how many fixture records exist, not on which are "recent".
      expect(
        getByTextAcrossElements("Total Violations: 6"),
      ).toBeInTheDocument();
      expect(getByTextAcrossElements("Class 1: 2")).toBeInTheDocument();
      expect(getByTextAcrossElements("Class 2: 2")).toBeInTheDocument();
      expect(getByTextAcrossElements("Class 3: 2")).toBeInTheDocument();

      // Dated the day the fixture loads, so it's always within the past
      // year and always visible without expanding older records.
      expect(
        screen.getByText("Refusal to Submit to Drug Test"),
      ).toBeInTheDocument();
      // Every Anderson fixture record shares this facility, so more than one
      // visible record card can render it -- assert it appears, not that it's
      // unique.
      expect(
        screen.getAllByText("Western State Prison").length,
      ).toBeGreaterThan(0);
    });

    it("re-hydrates with the new tenant's conduct data when the tenant changes without navigating away", async () => {
      const { rerender } = renderAtPath("/parole/case/DOC-45821");

      expect(
        await findSectionHeading("Institutional Conduct History"),
      ).toBeInTheDocument();
      expect(getByTextAcrossElements("Class 1: 2")).toBeInTheDocument();

      rootStore.tenantStore.currentTenantId = "US_ID";
      rerender(
        <MemoryRouter initialEntries={["/parole/case/DOC-45821"]}>
          <Routes>
            <Route path="/parole/case/:docId" element={<ParoleCaseProfile />} />
            <Route path="*" element={<ParoleCaseProfile />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(
        await findSectionHeading("Institutional Conduct History"),
      ).toBeInTheDocument();
      expect(getByTextAcrossElements("Major: 4")).toBeInTheDocument();
      expect(getByTextAcrossElements("Minor: 2")).toBeInTheDocument();
      expect(screen.queryByText("Class 1: 2")).not.toBeInTheDocument();
    });

    it("hides records older than a year until 'See Older Disciplinaries' is clicked", async () => {
      const user = userEvent.setup();
      renderAtPath("/parole/case/DOC-45821");

      // Dated 34 months before the fixture loads, so it's always well
      // outside the past year and always hidden until expanded.
      expect(
        await findSectionHeading("Institutional Conduct History"),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Possession of Contraband"),
      ).not.toBeInTheDocument();

      const toggle = screen.getByRole("button", {
        name: /see older disciplinaries/i,
      });
      expect(toggle).toHaveAttribute("aria-expanded", "false");

      await user.click(toggle);

      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText("Possession of Contraband")).toBeInTheDocument();
    });

    it("renders a clean-record empty state when there is no conduct history", async () => {
      renderAtPath("/parole/case/DOC-59402");

      expect(await screen.findByText("Harris, Patricia")).toBeInTheDocument();
      expect(
        screen.getByText("No Disciplinary Infractions"),
      ).toBeInTheDocument();
      expect(screen.queryByText(/Total Violations:/)).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /see older disciplinaries/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("the risk score trajectory section", () => {
    it("defaults to US_CO's 'Entire CTAP Suite' aggregate view", async () => {
      renderAtPath("/parole/case/DOC-45821");

      expect(
        await findSectionHeading("Risk Score Trajectory"),
      ).toBeInTheDocument();
      // US_CO's riskAssessmentConfig limits the aggregate view to its
      // curated tool set (RT, SRT, PIT), not every tool with an assessment.
      const assessmentCount = screen.getByText("3 assessment types selected");
      expect(assessmentCount).toBeInTheDocument();
      // US_CO has a custom riskAssessmentConfig, so the aggregate view uses
      // its "Entire CTAP Suite" label instead of the default. Scoped to the
      // header (not the legend toggle, which shows the same label).
      expect(
        within(assessmentCount.parentElement as HTMLElement).getByText(
          "Entire CTAP Suite",
        ),
      ).toBeInTheDocument();
    });

    it("shows the score, assessment date, and risk pill for a selected assessment tool", async () => {
      const user = userEvent.setup();
      renderAtPath("/parole/case/DOC-45821");

      await findSectionHeading("Risk Score Trajectory");
      await user.click(screen.getByRole("button", { name: /^LSI/ }));

      expect(screen.getByText("31 / 54")).toBeInTheDocument();
      expect(
        screen.getByText("Subcategory Breakdown (Most recent assessment)"),
      ).toBeInTheDocument();
    });

    it("labels CARAS risk levels using its own probability bands", async () => {
      const user = userEvent.setup();
      renderAtPath("/parole/case/DOC-45821");

      await findSectionHeading("Risk Score Trajectory");
      await user.click(screen.getByRole("button", { name: /^CARAS/ }));

      // Anderson's fixture CARAS factors are fixed inputs to the logistic
      // model, so this score (and its "Very Low" band) is deterministic
      // regardless of when the test runs.
      expect(screen.getByText("16 / 100")).toBeInTheDocument();
      // US_CO's custom riskAssessmentConfig suppresses the "-- {pct}%" badge
      // suffix, so only the band label itself renders.
      expect(screen.getByText("Very Low Risk")).toBeInTheDocument();
      expect(screen.getByText("Assessed Apr 16, 2026")).toBeInTheDocument();
    });
  });

  describe("the program participation section", () => {
    it("renders only completed DOC and Edovo programs with their completion dates", async () => {
      renderAtPath("/parole/case/DOC-45821");

      expect(
        await findSectionHeading("Program Participation"),
      ).toBeInTheDocument();

      expect(screen.getByText("DOC Programs (2)")).toBeInTheDocument();
      expect(
        screen.getByText("Cognitive Behavioral Therapy"),
      ).toBeInTheDocument();
      expect(screen.getByText("Substance Abuse Treatment")).toBeInTheDocument();
      expect(
        screen.queryByText("Vocational Training - Welding"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Anger Management")).not.toBeInTheDocument();

      expect(screen.getByText("Edovo Programs (2)")).toBeInTheDocument();
      expect(screen.getByText("Financial Literacy Basics")).toBeInTheDocument();
      expect(screen.getByText("Resume Building Workshop")).toBeInTheDocument();
      expect(
        screen.queryByText("Mindfulness and Stress Management"),
      ).not.toBeInTheDocument();
    });

    it("renders an empty state for a case with no programs on record", async () => {
      renderAtPath("/parole/case/DOC-59402");

      expect(
        await findSectionHeading("Program Participation"),
      ).toBeInTheDocument();
      expect(screen.getByText("DOC Programs (0)")).toBeInTheDocument();
      expect(
        screen.getByText("No completed DOC programs on record."),
      ).toBeInTheDocument();
      expect(screen.getByText("Edovo Programs (0)")).toBeInTheDocument();
      expect(
        screen.getByText("No completed Edovo programs on record."),
      ).toBeInTheDocument();
    });
  });

  describe("the offense & criminal history section", () => {
    it("renders the current offense's facts", async () => {
      renderAtPath("/parole/case/DOC-45821");

      expect(
        await findSectionHeading("Offense & Criminal History"),
      ).toBeInTheDocument();
      expect(screen.getByText("Sangamon County")).toBeInTheDocument();
      expect(screen.getByText("2021-CF-0489")).toBeInTheDocument();
      expect(screen.getByText("Class X Felony")).toBeInTheDocument();
      expect(screen.getByText("Armed Robbery")).toBeInTheDocument();
      expect(screen.getByText("8 years")).toBeInTheDocument();
      expect(
        screen.getByText(/Defendant entered convenience store with firearm/),
      ).toBeInTheDocument();
    });

    it("renders a banner when a victim was involved in the current offense", async () => {
      renderAtPath("/parole/case/DOC-45821");

      expect(
        await screen.findByText("Victim involved in current offense"),
      ).toBeInTheDocument();
    });

    it("renders no victim banner when no victim was involved", async () => {
      renderAtPath("/parole/case/DOC-52903");

      await findSectionHeading("Offense & Criminal History");
      expect(
        screen.queryByText("Victim involved in current offense"),
      ).not.toBeInTheDocument();
    });

    it("renders the list of prior convictions", async () => {
      renderAtPath("/parole/case/DOC-45821");

      // The fixture derives these dates as N years back from whichever day
      // the fixture module happens to load, so the expected month must be
      // computed the same way rather than hardcoded -- otherwise this test
      // breaks every time the calendar rolls into a new month.
      const theftMonth = format(subYears(new Date(), 8), "MMM");
      const assaultMonth = format(subYears(new Date(), 7), "MMM");

      expect(await screen.findByText("Prior Convictions")).toBeInTheDocument();
      expect(
        screen.getByText(new RegExp(`Theft — ${theftMonth}`)),
      ).toBeInTheDocument();
      expect(
        screen.getByText(new RegExp(`Assault — ${assaultMonth}`)),
      ).toBeInTheDocument();
    });

    it("omits the prior convictions subsection when there are none", async () => {
      renderAtPath("/parole/case/DOC-52903");

      await findSectionHeading("Offense & Criminal History");
      expect(screen.queryByText("Prior Convictions")).not.toBeInTheDocument();
    });
  });
});
