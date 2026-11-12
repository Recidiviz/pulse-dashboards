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
import { createRef } from "react";

import {
  AUTOSAVE_FAILED_MESSAGE,
  ReportLongTextField,
  ReportLongTextFieldHandle,
} from "../ReportLongTextField";
import { MISSING_VALUE_TEXT } from "../ReportRowList";
import { AUTOSAVE_DELAY_MS } from "../useAutosavedText";

const DESCRIPTION =
  "Entered a convenience store and demanded the cash in the register.\n\n" +
  "Pleaded guilty to Robbery.";

describe("ReportLongTextField", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("labels the box and counts its characters", () => {
    render(
      <ReportLongTextField
        mode="EDIT"
        label="Description"
        placeholder="Enter description"
        value="Entered a store"
        onSave={vi.fn()}
        maxLength={1500}
      />,
    );

    const box = screen.getByLabelText("Description");
    expect(box).toHaveValue("Entered a store");
    expect(box).toHaveAttribute("placeholder", "Enter description");
    expect(box).toHaveAttribute("maxLength", "1500");
    expect(screen.getByText("15/1500")).toBeInTheDocument();
  });

  it("saves the PHI's text after a pause in typing", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <ReportLongTextField
        mode="EDIT"
        label="Description"
        value={null}
        onSave={onSave}
        maxLength={1500}
      />,
    );

    const box = screen.getByLabelText("Description");
    fireEvent.focus(box);
    fireEvent.change(box, { target: { value: "Entered a store" } });
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));

    expect(onSave).toHaveBeenCalledWith("Entered a store");
  });

  it("shows an error when a save fails, and Try again saves again", async () => {
    const onSave = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(undefined);
    render(
      <ReportLongTextField
        mode="EDIT"
        label="Description"
        value={null}
        onSave={onSave}
        maxLength={1500}
      />,
    );

    const box = screen.getByLabelText("Description");
    fireEvent.focus(box);
    fireEvent.change(box, { target: { value: "Entered a store" } });
    await act(async () => fireEvent.blur(box));

    expect(screen.getByRole("alert")).toHaveTextContent(
      AUTOSAVE_FAILED_MESSAGE,
    );
    expect(box).toHaveValue("Entered a store");

    await act(async () => fireEvent.click(screen.getByText("Try again")));

    expect(onSave).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("saves unsaved text when the section calls flush", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const ref = createRef<ReportLongTextFieldHandle>();
    render(
      <ReportLongTextField
        ref={ref}
        mode="EDIT"
        label="Description"
        value={null}
        onSave={onSave}
        maxLength={1500}
      />,
    );

    const box = screen.getByLabelText("Description");
    fireEvent.focus(box);
    fireEvent.change(box, { target: { value: "Entered a store" } });
    await act(() => ref.current?.flush() ?? Promise.resolve());

    expect(onSave).toHaveBeenCalledWith("Entered a store");
  });

  it("shows the saved text with its line breaks in read mode", () => {
    render(
      <ReportLongTextField
        mode="READ"
        label="Description"
        value={DESCRIPTION}
        onSave={vi.fn()}
        maxLength={1500}
      />,
    );

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === DESCRIPTION),
    ).toBeInTheDocument();
  });

  it("marks an empty field in read mode", () => {
    render(
      <ReportLongTextField
        mode="READ"
        label="Description"
        value={null}
        onSave={vi.fn()}
        maxLength={1500}
      />,
    );

    expect(screen.getByText(MISSING_VALUE_TEXT)).toBeInTheDocument();
  });
});
