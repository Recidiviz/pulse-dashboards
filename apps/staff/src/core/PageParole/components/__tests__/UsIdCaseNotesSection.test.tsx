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
import { format, subDays } from "date-fns";
import ReactModal from "react-modal";

import { ParoleCaseNote } from "~datatypes";

import { UsIdCaseNotesSection } from "../US_ID/UsIdCaseNotesSection";

beforeAll(() => {
  ReactModal.setAppElement(document.createElement("div"));
});

/** Notes one day apart, newest (index 0) on 2026-03-01. */
function makeNotes(count: number): Array<ParoleCaseNote> {
  return Array.from({ length: count }, (_, i) => ({
    id: `n-${i}`,
    type: i % 2 === 0 ? "Supervision Notes" : "Parole Board Note",
    date: format(subDays(new Date(2026, 2, 1), i), "yyyy-MM-dd"),
    body: `Body of note ${i}.`,
  }));
}

describe("UsIdCaseNotesSection", () => {
  // Pin "now" just after the newest fixture note, so the 3-year window is
  // fixed rather than drifting with the real clock.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 2, 2));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("says so in the caption when no notes are sent, with no second label", () => {
    render(<UsIdCaseNotesSection caseNotes={undefined} />);

    expect(
      screen.getByText("No case notes in the last 3 years"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Showing case notes/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Next page")).not.toBeInTheDocument();
  });

  it("drops notes older than the 3-year window", () => {
    const [recent] = makeNotes(1);
    const stale = {
      id: "old",
      type: "PSI",
      date: "2022-01-01",
      body: "Body of a note from more than three years ago.",
    };

    render(<UsIdCaseNotesSection caseNotes={[recent, stale]} />);

    expect(screen.getByText("Body of note 0.")).toBeInTheDocument();
    expect(screen.queryByText(stale.body)).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("falls back to the empty caption when every note is too old", () => {
    render(
      <UsIdCaseNotesSection
        caseNotes={[
          { id: "old", type: "PSI", date: "2019-06-01", body: "Ancient." },
        ]}
      />,
    );

    expect(
      screen.getByText("No case notes in the last 3 years"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Ancient.")).not.toBeInTheDocument();
  });

  it("shows the source's own note type, not a code", () => {
    render(<UsIdCaseNotesSection caseNotes={makeNotes(2)} />);

    // Scoped to the list: the type filter names every type too.
    const list = within(screen.getByTestId("us-id-case-notes-list"));
    expect(list.getByText("Supervision Notes")).toBeInTheDocument();
    expect(list.getByText("Parole Board Note")).toBeInTheDocument();
  });

  it("pages ten notes at a time and counts them as a range", () => {
    render(<UsIdCaseNotesSection caseNotes={makeNotes(32)} />);

    expect(screen.getByText("Body of note 0.")).toBeInTheDocument();
    expect(screen.queryByText("Body of note 10.")).not.toBeInTheDocument();
    expect(screen.getByText("1-10 of 32")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Next page"));
    expect(screen.getByText("Body of note 10.")).toBeInTheDocument();
    expect(screen.getByText("11-20 of 32")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Next page"));
    expect(screen.getByText("21-30 of 32")).toBeInTheDocument();

    // 32 notes leaves a short last page of 2.
    fireEvent.click(screen.getByLabelText("Last page"));
    expect(screen.getByText("Body of note 31.")).toBeInTheDocument();
    expect(screen.getByText("31-32 of 32")).toBeInTheDocument();
  });

  it("orders notes newest first regardless of the order sent", () => {
    const [newest, oldest] = makeNotes(2);
    render(<UsIdCaseNotesSection caseNotes={[oldest, newest]} />);

    const bodies = within(screen.getByTestId("us-id-case-notes-list"))
      .getAllByRole("button")
      .map((row) => row.textContent ?? "");
    expect(bodies[0]).toContain("Body of note 0.");
    expect(bodies[1]).toContain("Body of note 1.");
  });

  it("opens the clicked note in the modal", () => {
    render(<UsIdCaseNotesSection caseNotes={makeNotes(2)} />);

    fireEvent.click(screen.getByText("Body of note 1."));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Body of note 1.")).toBeInTheDocument();
    expect(within(dialog).getByText("Parole Board Note")).toBeInTheDocument();
  });

  it("narrows the list with the type filter's ONLY shortcut", () => {
    render(<UsIdCaseNotesSection caseNotes={makeNotes(30)} />);

    // 30 notes alternate type, so fifteen of each.
    expect(screen.getByText("1-10 of 30")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Filters/ }));

    // The type names the rows too, so scope to the filter's own option row.
    const notesList = screen.getByTestId("us-id-case-notes-list");
    const option = screen
      .getAllByText("Parole Board Note")
      .find((element) => !notesList.contains(element));
    if (!option) throw new Error("Expected a filter option for the type.");

    const row = option.closest("div[class]")?.parentElement;
    fireEvent.click(within(row as HTMLElement).getByText("ONLY"));

    expect(
      within(screen.getByTestId("us-id-case-notes-list")).queryByText(
        "Supervision Notes",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByText("1-10 of 15")).toBeInTheDocument();
  });

  it("hides the type filter when every note shares a type", () => {
    const [onlyNote] = makeNotes(1);
    render(<UsIdCaseNotesSection caseNotes={[onlyNote]} />);

    expect(
      screen.queryByRole("button", { name: /Filters/ }),
    ).not.toBeInTheDocument();
  });

  it("toggles between clearing and selecting every type", () => {
    render(<UsIdCaseNotesSection caseNotes={makeNotes(4)} />);

    fireEvent.click(screen.getByRole("button", { name: /Filters/ }));

    // Everything starts selected, so the control offers to clear.
    fireEvent.click(screen.getByText("Clear all filters"));
    expect(
      screen.getByText("No case notes match the selected filters"),
    ).toBeInTheDocument();

    // With nothing selected it offers the reverse.
    fireEvent.click(screen.getByText("Select all filters"));
    expect(
      screen.queryByText("No case notes match the selected filters"),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId("us-id-case-notes-list")).getAllByRole(
        "button",
      ),
    ).toHaveLength(4);
  });
});
