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

import { fireEvent, render, screen } from "@testing-library/react";
import ReactModal from "react-modal";

import { RecentCaseNoteModal } from "../RecentCaseNoteModal";
import { RecentCaseNote } from "../useRecentCaseNotes";

beforeAll(() => {
  ReactModal.setAppElement(document.createElement("div"));
});

const sampleNote: RecentCaseNote = {
  id: "n-1",
  source: "MOSAGI - OFFICE VISIT",
  date: new Date("2026-04-15"),
  body: "Full body of the case note, including\nmultiple paragraphs of content.",
};

describe("RecentCaseNoteModal", () => {
  it("renders the title and the note body when open with a note", () => {
    render(
      <RecentCaseNoteModal
        isOpen
        note={sampleNote}
        onRequestClose={() => undefined}
      />,
    );

    expect(screen.getByText("Case Note")).toBeInTheDocument();
    expect(screen.getByText("MOSAGI - OFFICE VISIT")).toBeInTheDocument();
    expect(screen.getByText(/Full body of the case note/)).toBeInTheDocument();
  });

  it("renders only the header when note is undefined", () => {
    render(
      <RecentCaseNoteModal
        isOpen
        note={undefined}
        onRequestClose={() => undefined}
      />,
    );

    expect(screen.getByText("Case Note")).toBeInTheDocument();
    expect(screen.queryByText("MOSAGI - OFFICE VISIT")).not.toBeInTheDocument();
  });

  it("calls onRequestClose when the Close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <RecentCaseNoteModal
        isOpen
        note={sampleNote}
        onRequestClose={handleClose}
      />,
    );

    fireEvent.click(screen.getByLabelText("Close"));

    expect(handleClose).toHaveBeenCalled();
  });

  it("calls onRequestClose when ESC is pressed inside the modal", () => {
    const handleClose = vi.fn();
    render(
      <RecentCaseNoteModal
        isOpen
        note={sampleNote}
        onRequestClose={handleClose}
      />,
    );

    // react-modal listens for Escape on its content element via keyDown.
    fireEvent.keyDown(screen.getByRole("dialog"), {
      key: "Escape",
      keyCode: 27,
      which: 27,
    });

    expect(handleClose).toHaveBeenCalled();
  });
});
