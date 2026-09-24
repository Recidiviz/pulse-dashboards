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

import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import { subYears } from "date-fns";

import { ParoleConductRecord } from "~datatypes";

import { PaletteKey } from "../../../../BadgePill/BadgePill";
import { UsIdDisciplinaryReportsSection } from "../UsIdDisciplinaryReportsSection";

const CLASSIFICATION_COLORS: Record<string, PaletteKey> = {
  "Class B": "PURPLE",
  "Class C": "SLATE_DARK",
};

const iso = (date: Date) => date.toISOString().slice(0, 10);

function record(fields: Partial<ParoleConductRecord>): ParoleConductRecord {
  return {
    date: iso(subYears(new Date(), 1)),
    facility: "ISCI, medium",
    violation: "Fighting with another resident",
    description: "Resident stated the other individual provoked her.",
    severity: "Class B",
    disposition: "Loss of privileges",
    ...fields,
  };
}

function renderSection(conductHistory: Array<ParoleConductRecord>) {
  return render(
    <UsIdDisciplinaryReportsSection
      conductHistory={conductHistory}
      conductClassificationColors={CLASSIFICATION_COLORS}
    />,
  );
}

describe("UsIdDisciplinaryReportsSection", () => {
  it("renders each report's date, offense, institution and class", () => {
    renderSection([record({})]);

    expect(
      screen.getByText("Disciplinary Offense Reports (DOR)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Offense")).toBeInTheDocument();
    expect(
      screen.getByText("Fighting with another resident"),
    ).toBeInTheDocument();
    expect(screen.getByText("Institution")).toBeInTheDocument();
    expect(screen.getByText("ISCI, medium")).toBeInTheDocument();
    expect(screen.getByText("Class B")).toBeInTheDocument();
  });

  it("renders the narrative below the facts", () => {
    renderSection([
      record({ description: "Resident admitted to possessing tobacco." }),
    ]);

    expect(
      screen.getByText("Resident admitted to possessing tobacco."),
    ).toBeInTheDocument();
  });

  it("dates a report by month and year only", () => {
    renderSection([record({ date: "2025-05-14" })]);

    expect(screen.getByText("May 2025")).toBeInTheDocument();
    expect(screen.queryByText("May 14, 2025")).not.toBeInTheDocument();
  });

  it("leaves out reports older than three years, with no toggle to reveal them", () => {
    renderSection([
      record({ violation: "Recent Offense" }),
      record({
        violation: "Ancient Offense",
        date: iso(subYears(new Date(), 4)),
      }),
    ]);

    expect(screen.getByText("Recent Offense")).toBeInTheDocument();
    expect(screen.queryByText("Ancient Offense")).not.toBeInTheDocument();
    // Unlike US_CO, Idaho offers nothing to reveal the older ones. The only
    // buttons here are each card's own narrative toggle.
    expect(
      screen.queryByRole("button", { name: /older/i }),
    ).not.toBeInTheDocument();
  });

  it("does not show the disposition, which the V1 design drops", () => {
    renderSection([record({ disposition: "Loss of privileges" })]);

    expect(screen.queryByText(/Loss of privileges/)).not.toBeInTheDocument();
  });

  it("scopes the empty state to the window rather than the whole record", () => {
    renderSection([
      record({ violation: "Ancient", date: iso(subYears(new Date(), 5)) }),
    ]);

    expect(
      screen.getByText("No DORs in the last 3 years."),
    ).toBeInTheDocument();
  });

  it("shows the same empty state when there are no reports at all", () => {
    renderSection([]);

    expect(
      screen.getByText("No DORs in the last 3 years."),
    ).toBeInTheDocument();
  });

  it("renders both reports when two share a date and a violation", () => {
    renderSection([
      record({ description: "First account of the incident." }),
      record({ description: "Second account of the incident." }),
    ]);

    expect(
      screen.getByText("First account of the incident."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Second account of the incident."),
    ).toBeInTheDocument();
  });

  it("opens the full report in a modal when a card is clicked", () => {
    const description = Array.from(
      { length: 40 },
      (_, i) => `Sentence ${i} of the officer's account.`,
    ).join(" ");
    renderSection([record({ description, violation: "Fighting" })]);

    fireEvent.click(screen.getByRole("button", { name: /Fighting/ }));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText("Disciplinary Offense Report"),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(description)).toBeInTheDocument();
  });

  it("closes the report modal", async () => {
    renderSection([record({ violation: "Fighting" })]);

    fireEvent.click(screen.getByRole("button", { name: /Fighting/ }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByLabelText("Close"));

    // The design system's Modal animates out over 300ms, so it leaves the
    // DOM a beat after the click rather than on it.
    await waitForElementToBeRemoved(dialog);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
