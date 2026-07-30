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
import { MemoryRouter, Route, Routes } from "react-router-dom";

import * as StoreProvider from "../../../../components/StoreProvider";
import { ParoleStore } from "../../../../ParoleStore/ParoleStore";
import { RootStore } from "../../../../RootStore";
import { ParoleCaseProfile } from "../ParoleCaseProfile";

vi.mock("../../../../components/StoreProvider");

const useRootStoreMock = vi.mocked(StoreProvider.useRootStore);

beforeEach(() => {
  useRootStoreMock.mockReturnValue({
    paroleStore: new ParoleStore(new RootStore()),
  } as never);
});

// The label and value in rows like "Total Violations: 6" are separate
// elements (the value is wrapped in a FactValue span), so the default
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
    it("renders the individual's identity, hearing, and sentence info", async () => {
      renderAtPath("/parole/case/DOC-45821");

      expect(await screen.findByText("Anderson, Michael")).toBeInTheDocument();
      expect(screen.getByText("DOC-45821")).toBeInTheDocument();
      expect(screen.getByText(/Date of Birth:/)).toBeInTheDocument();
      expect(
        screen.getByText("Central State Correctional Facility"),
      ).toBeInTheDocument();
      expect(screen.getByText("Jennifer Martinez")).toBeInTheDocument();
      expect(screen.getByText("Minimum")).toBeInTheDocument();
      expect(screen.getByText("Sentence Information")).toBeInTheDocument();
      expect(
        screen.getByText("Parole Eligibility Date (PED)"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Mandatory Release Date (MRD)"),
      ).toBeInTheDocument();
    });

    it("renders a hearing-scheduled badge when a hearing is upcoming", async () => {
      renderAtPath("/parole/case/DOC-45821");

      expect(await screen.findByText("Hearing Scheduled")).toBeInTheDocument();
      expect(screen.getByText("9:00 AM")).toBeInTheDocument();
    });

    it("renders no badge and a 'Not scheduled' hearing date when there is no upcoming hearing", async () => {
      renderAtPath("/parole/case/DOC-59402");

      expect(await screen.findByText("Harris, Patricia")).toBeInTheDocument();
      expect(screen.getByText("Not scheduled")).toBeInTheDocument();
      expect(screen.queryByText("Hearing Scheduled")).not.toBeInTheDocument();
    });
  });

  describe("the attachments section", () => {
    it("merges the parole plan documents and attachments into one newest-to-oldest list", async () => {
      renderAtPath("/parole/case/DOC-45821");

      expect(await screen.findByText("Attachments")).toBeInTheDocument();

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

      await screen.findByText("Attachments");
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
        await screen.findByText("Institutional Conduct History"),
      ).toBeInTheDocument();
      // These counts are stable regardless of the current date -- they only
      // depend on how many fixture records exist, not on which are "recent".
      expect(
        getByTextAcrossElements("Total Violations: 6"),
      ).toBeInTheDocument();
      expect(getByTextAcrossElements("Major: 4")).toBeInTheDocument();
      expect(getByTextAcrossElements("Minor: 2")).toBeInTheDocument();

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

    it("hides records older than a year until 'See Older Disciplinaries' is clicked", async () => {
      const user = userEvent.setup();
      renderAtPath("/parole/case/DOC-45821");

      // Dated 34 months before the fixture loads, so it's always well
      // outside the past year and always hidden until expanded.
      expect(
        await screen.findByText("Institutional Conduct History"),
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

  describe("the program participation section", () => {
    it("renders only completed DOC and Edovo programs with their completion dates", async () => {
      renderAtPath("/parole/case/DOC-45821");

      expect(
        await screen.findByText("Program Participation"),
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
        await screen.findByText("Program Participation"),
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
});
