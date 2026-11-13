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

import { act, fireEvent, render, screen } from "@testing-library/react";

import { PersonalHistoryInput } from "~datatypes";

import { resolvePersonalHistory } from "../../../../../ParoleStore/report/personalHistory";
import { MISSING_VALUE_TEXT } from "../report/constants";
import { AUTOSAVE_DELAY_MS } from "../report/useAutosavedText";
import { UsIdPersonalHistorySection } from "../UsIdPersonalHistorySection";

const EDUCATION_TEXT =
  "Left high school in the 11th grade.\n\nEarned a GED while incarcerated.";

const phiEdit = <T,>(value: T) => ({
  value,
  updatedBy: "phi@us_id.gov",
  updatedAt: new Date("2026-11-12T15:00:00Z"),
});

function renderSection({
  mode = "EDIT",
  input,
}: {
  mode?: "EDIT" | "READ";
  input?: PersonalHistoryInput;
}) {
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(
    <UsIdPersonalHistorySection
      mode={mode}
      history={resolvePersonalHistory(input)}
      onSave={onSave}
    />,
  );
  return onSave;
}

describe("UsIdPersonalHistorySection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the five background boxes, then Resident's Comments, each with its label and limit", () => {
    renderSection({});

    const boxes = screen.getAllByRole("textbox");
    expect(boxes.map((box) => box.getAttribute("aria-label"))).toEqual([
      "Social History/Early Life",
      "Relationships/Children",
      "Education Background",
      "Occupational Background",
      "Military Background",
      "Resident's Comments",
    ]);
    expect(boxes.map((box) => box.getAttribute("maxLength"))).toEqual([
      "2500",
      "1500",
      "1000",
      "1000",
      "500",
      "1500",
    ]);
  });

  it("shows the PHI's saved text in its box and leaves the rest empty", () => {
    renderSection({
      input: { fields: { education: phiEdit(EDUCATION_TEXT) } },
    });

    expect(screen.getByLabelText("Education Background")).toHaveValue(
      EDUCATION_TEXT,
    );
    expect(screen.getByLabelText("Military Background")).toHaveValue("");
  });

  it("saves a box's text to its own field after a pause in typing", async () => {
    const onSave = renderSection({});

    const box = screen.getByLabelText("Resident's Comments");
    fireEvent.focus(box);
    fireEvent.change(box, { target: { value: "Wants to keep attending AA." } });
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));

    expect(onSave).toHaveBeenCalledWith(
      "residentComments",
      "Wants to keep attending AA.",
    );
  });

  it("shows the text, and the missing-value text for empty boxes, in read mode", () => {
    renderSection({
      mode: "READ",
      input: { fields: { education: phiEdit(EDUCATION_TEXT) } },
    });

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Earned a GED while incarcerated/),
    ).toBeInTheDocument();
    expect(screen.getAllByText(MISSING_VALUE_TEXT)).toHaveLength(5);
  });
});
