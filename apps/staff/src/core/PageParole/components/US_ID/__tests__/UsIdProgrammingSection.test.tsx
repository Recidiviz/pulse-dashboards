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

import { fireEvent, render, screen, within } from "@testing-library/react";

import { ParoleDocProgram, ParoleEdovoProgram } from "~datatypes";

import { UsIdProgrammingSection } from "../UsIdProgrammingSection";

function docProgram(fields: Partial<ParoleDocProgram>): ParoleDocProgram {
  return {
    name: "Thinking for a Change",
    referralDate: "2006-06-01",
    startDate: "2006-07-22",
    completionDate: null,
    type: "Treatment",
    criminogenicNeed: "Antisocial Thinking",
    status: "IN_PROGRESS",
    ...fields,
  };
}

function edovoProgram(fields: Partial<ParoleEdovoProgram>): ParoleEdovoProgram {
  return {
    title: "Financial Literacy Basics",
    completionDate: "2020-02-01",
    status: "completed",
    startDate: "2020-01-15",
    ...fields,
  };
}

function renderSection(
  docPrograms: Array<ParoleDocProgram>,
  edovoPrograms: Array<ParoleEdovoProgram> = [],
) {
  return render(
    <UsIdProgrammingSection
      docPrograms={docPrograms}
      edovoPrograms={edovoPrograms}
    />,
  );
}

/** The program name and status from each body row, top to bottom. */
function renderedRows(): Array<Array<string>> {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole("cell")
        .map((cell) => cell.textContent ?? ""),
    );
}

describe("UsIdProgrammingSection", () => {
  it("renders the Date, Program and Status columns", () => {
    renderSection([docProgram({})]);

    expect(screen.getByText("Programming")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Date" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Program" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeVisible();
  });

  it("shows programs of every status, not only completed ones", () => {
    renderSection([
      docProgram({ name: "Enrolled Program", status: "IN_PROGRESS" }),
      docProgram({ name: "Waitlisted Program", status: "PENDING" }),
      docProgram({
        name: "Removed Program",
        status: "DISCHARGED_UNSUCCESSFUL",
      }),
      docProgram({
        name: "Finished Program",
        status: "DISCHARGED_SUCCESSFUL",
      }),
    ]);

    const statusByProgram = new Map(
      renderedRows().map(([, name, status]) => [name, status]),
    );
    expect(statusByProgram.get("Enrolled Program")).toBe("Enrolled");
    expect(statusByProgram.get("Waitlisted Program")).toBe("Waitlisted");
    expect(statusByProgram.get("Removed Program")).toBe("Removed");
    expect(statusByProgram.get("Finished Program")).toBe("Completed");
  });

  it("tells a non-disciplinary removal apart from a disciplinary one", () => {
    renderSection([
      docProgram({ name: "Failed Out", status: "DISCHARGED_UNSUCCESSFUL" }),
      docProgram({ name: "Transferred", status: "DISCHARGED_OTHER" }),
    ]);

    const statusByProgram = new Map(
      renderedRows().map(([, name, status]) => [name, status]),
    );
    expect(statusByProgram.get("Failed Out")).toBe("Removed");
    expect(statusByProgram.get("Transferred")).toBe(
      "Removed (non-disciplinary)",
    );
  });

  it("names a DENIED program for what it means in Idaho", () => {
    renderSection([docProgram({ name: "Waitlist Drop", status: "DENIED" })]);

    expect(screen.getByText("Removed from waitlist")).toBeInTheDocument();
  });

  it("merges Edovo programs into the same list", () => {
    renderSection(
      [docProgram({ name: "DOC Program" })],
      [edovoProgram({ title: "Edovo Program" })],
    );

    const names = renderedRows().map(([, name]) => name);
    expect(names).toContain("DOC Program");
    expect(names).toContain("Edovo Program");
  });

  it("orders programs newest first", () => {
    renderSection([
      docProgram({ name: "Older", startDate: "2019-01-01" }),
      docProgram({ name: "Newest", startDate: "2024-01-01" }),
      docProgram({ name: "Middle", startDate: "2021-01-01" }),
    ]);

    expect(renderedRows().map(([, name]) => name)).toEqual([
      "Newest",
      "Middle",
      "Older",
    ]);
  });

  it.each([
    ["DISCHARGED_SUCCESSFUL", "3/1/2026"],
    ["DISCHARGED_UNSUCCESSFUL", "3/1/2026"],
    ["DISCHARGED_OTHER", "3/1/2026"],
    ["DENIED", "3/1/2026"],
    ["IN_PROGRESS", "7/22/2006"],
    ["PENDING", "6/1/2006"],
  ] as const)(
    "dates a %s program by the date matching its state",
    (status, expectedDate) => {
      renderSection([
        docProgram({
          status,
          referralDate: "2006-06-01",
          startDate: "2006-07-22",
          completionDate: "2026-03-01",
        }),
      ]);

      expect(screen.getByText(expectedDate)).toBeInTheDocument();
    },
  );

  it("falls back through the other dates when the expected one is missing", () => {
    renderSection([
      // Idaho's DENIED programs carry only a completion date.
      docProgram({
        name: "Waitlist Drop",
        status: "DENIED",
        startDate: undefined,
        referralDate: undefined,
        completionDate: "2026-03-01",
      }),
      // A waitlisted program has no start or completion date to fall back to.
      docProgram({
        name: "Still Waiting",
        status: "PENDING",
        startDate: undefined,
        completionDate: null,
        referralDate: "2006-06-01",
      }),
    ]);

    expect(screen.getByText("3/1/2026")).toBeInTheDocument();
    expect(screen.getByText("6/1/2006")).toBeInTheDocument();
    expect(screen.queryByText("----")).not.toBeInTheDocument();
  });

  it("dates an Edovo program by its state too", () => {
    renderSection(
      [],
      [
        edovoProgram({
          title: "Finished Course",
          status: "completed",
          startDate: "2020-01-15",
          completionDate: "2020-02-01",
        }),
        edovoProgram({
          title: "Open Course",
          status: "in-progress",
          startDate: "2021-05-04",
          completionDate: null,
        }),
      ],
    );

    expect(screen.getByText("2/1/2020")).toBeInTheDocument();
    expect(screen.getByText("5/4/2021")).toBeInTheDocument();
  });

  it("shows an empty state when the resident has no programs", () => {
    renderSection([], []);

    expect(screen.getByText("No programs on record")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("pages ten programs at a time", () => {
    renderSection(
      Array.from({ length: 23 }, (_, i) =>
        docProgram({ name: `Program ${i}`, startDate: `2020-01-${i + 1}` }),
      ),
    );

    expect(renderedRows()).toHaveLength(10);
    expect(screen.getByText("1-10 of 23")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Last page"));
    expect(renderedRows()).toHaveLength(3);
    expect(screen.getByText("21-23 of 23")).toBeInTheDocument();
  });
});
