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
import ReactModal from "react-modal";
import { Mock } from "vitest";

import { Client } from "../../../../../WorkflowsStore";
import { RecentCaseNotes, truncateNoteBody } from "..";
import { RecentCaseNote, useRecentCaseNotes } from "../useRecentCaseNotes";

vi.mock("../useRecentCaseNotes", () => ({
  useRecentCaseNotes: vi.fn(),
}));

const useRecentCaseNotesMock = useRecentCaseNotes as Mock;

const mockClient = {} as Client;

const sampleNotes: RecentCaseNote[] = [
  {
    id: "n-1",
    source: "MOSAGI - OFFICE VISIT",
    date: new Date("2026-04-15"),
    body: "First note body — office visit went well.",
  },
  {
    id: "n-2",
    source: "MOSAGI - HOME VISIT",
    date: new Date("2026-03-20"),
    body: "Second note body — home visit completed.",
  },
  {
    id: "n-3",
    source: "MOSAGI - PHONE",
    date: new Date("2026-02-08"),
    body: "Third note body — brief phone check-in.",
  },
];

beforeAll(() => {
  ReactModal.setAppElement(document.createElement("div"));
});

describe("RecentCaseNotes", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders 3 note rows when the hook returns 3 notes", () => {
    useRecentCaseNotesMock.mockReturnValue({
      notes: sampleNotes,
      isLoading: false,
    });

    render(<RecentCaseNotes client={mockClient} />);

    expect(
      screen.getByText("First note body — office visit went well."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Second note body — home visit completed."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Third note body — brief phone check-in."),
    ).toBeInTheDocument();
    expect(screen.getByText("MOSAGI - OFFICE VISIT")).toBeInTheDocument();
    expect(screen.getByText("MOSAGI - HOME VISIT")).toBeInTheDocument();
    expect(screen.getByText("MOSAGI - PHONE")).toBeInTheDocument();
  });

  it("renders the empty-state copy when the hook returns no notes", () => {
    useRecentCaseNotesMock.mockReturnValue({ notes: [], isLoading: false });

    render(<RecentCaseNotes client={mockClient} />);

    expect(
      screen.getByText("No recent case notes from the past 90 days"),
    ).toBeInTheDocument();
  });

  it("opens the modal showing the clicked note's body", () => {
    useRecentCaseNotesMock.mockReturnValue({
      notes: sampleNotes,
      isLoading: false,
    });

    render(<RecentCaseNotes client={mockClient} />);

    const firstRowBody = screen.getByText(
      "First note body — office visit went well.",
    );
    fireEvent.click(firstRowBody);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Case Note")).toBeInTheDocument();
    expect(
      within(dialog).getByText("First note body — office visit went well."),
    ).toBeInTheDocument();
  });

  it("closes the modal when the Close button is clicked", () => {
    useRecentCaseNotesMock.mockReturnValue({
      notes: sampleNotes,
      isLoading: false,
    });

    render(<RecentCaseNotes client={mockClient} />);

    // Click first note row's preview body (which appears in both row + later
    // modal); before opening, there's exactly one match in the document.
    fireEvent.click(
      screen.getByText("First note body — office visit went well."),
    );

    // While open, the body appears in BOTH the row preview AND the modal.
    expect(
      screen.getAllByText("First note body — office visit went well."),
    ).toHaveLength(2);

    fireEvent.click(within(screen.getByRole("dialog")).getByLabelText("Close"));

    // After close, the body should appear only once — back in the row.
    expect(
      screen.getAllByText("First note body — office visit went well."),
    ).toHaveLength(1);
  });

  it("truncates a long note body to 50 words + ellipsis in the card row, but shows the full body in the modal", () => {
    // 70 words — over the 60-word threshold, so the row preview clips to 50.
    const longBody = Array.from({ length: 70 }, (_, i) => `word${i}`).join(" ");
    useRecentCaseNotesMock.mockReturnValue({
      notes: [{ id: "long", source: "POV", date: new Date(), body: longBody }],
      isLoading: false,
    });

    render(<RecentCaseNotes client={mockClient} />);

    const expectedPreview = `${Array.from({ length: 50 }, (_, i) => `word${i}`).join(" ")}…`;
    const rowPreview = screen.getByText(expectedPreview);
    expect(rowPreview).toBeInTheDocument();

    // Clicking opens the modal with the full, untruncated body.
    fireEvent.click(rowPreview);
    expect(
      within(screen.getByRole("dialog")).getByText(longBody),
    ).toBeInTheDocument();
  });
});

describe("truncateNoteBody", () => {
  const wordsOfLength = (n: number) =>
    Array.from({ length: n }, (_, i) => `w${i}`).join(" ");

  it("returns the body unchanged at exactly the 60-word threshold", () => {
    const body = wordsOfLength(60);
    expect(truncateNoteBody(body)).toBe(body);
  });

  it("returns the body unchanged when under the threshold", () => {
    const body = wordsOfLength(10);
    expect(truncateNoteBody(body)).toBe(body);
  });

  it("clips to 50 words + an ellipsis when over the threshold", () => {
    const result = truncateNoteBody(wordsOfLength(61));
    expect(result).toBe(`${wordsOfLength(50)}…`);
    // 50 words means 49 separating spaces.
    expect(result.replace("…", "").trim().split(/\s+/)).toHaveLength(50);
  });
});
