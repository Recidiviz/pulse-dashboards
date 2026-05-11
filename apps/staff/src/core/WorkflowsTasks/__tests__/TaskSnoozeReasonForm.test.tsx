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

import { TaskSnoozeReasonForm } from "../TaskSnoozeReasonForm";

function renderForm(
  overrides: {
    onSave?: (reason: string | undefined) => void;
    onCancel?: () => void;
  } = {},
) {
  const onSave = overrides.onSave ?? vi.fn();
  const onCancel = overrides.onCancel ?? vi.fn();
  render(<TaskSnoozeReasonForm onSave={onSave} onCancel={onCancel} />);
  return { onSave, onCancel };
}

const getReasonInput = () =>
  screen.getByPlaceholderText("Please specify a reason...");
const getSaveButton = () => screen.getByRole("button", { name: "Save" });
const getCancelButton = () => screen.getByRole("button", { name: "Cancel" });

describe("TaskSnoozeReasonForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("renders the prompt, counter, Cancel and Save", () => {
    renderForm();
    expect(
      screen.getByText("Why is this task not actionable? (optional)"),
    ).toBeInTheDocument();
    expect(getReasonInput()).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("/ 1600")).toBeInTheDocument();
    expect(getSaveButton()).toBeInTheDocument();
    expect(getCancelButton()).toBeInTheDocument();
  });

  test("does not render Back, Close, or Skip controls", () => {
    renderForm();
    expect(screen.queryByRole("button", { name: /back/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /close/i })).toBeNull();
    expect(screen.queryByRole("checkbox", { name: /skip/i })).toBeNull();
  });

  describe("Save validity", () => {
    test("Save is enabled when reason is empty (optional path)", () => {
      renderForm();
      expect(getSaveButton()).not.toBeDisabled();
    });

    test("Save is disabled when reason has 1-2 characters", () => {
      renderForm();
      fireEvent.change(getReasonInput(), { target: { value: "ab" } });
      expect(getSaveButton()).toBeDisabled();
    });

    test("Save is enabled when reason has 3+ characters", () => {
      renderForm();
      fireEvent.change(getReasonInput(), { target: { value: "moving" } });
      expect(getSaveButton()).not.toBeDisabled();
    });

    test("Save validity tracks raw input length (not trimmed) to match the counter", () => {
      // The character counter shown to the user is on the raw value; the
      // Save gate must agree, otherwise the user gets a disabled-Save with
      // a counter saying they typed enough.
      renderForm();
      // 3 raw chars (all whitespace) is "long enough" by the counter, so
      // Save is enabled — keeping form logic and counter aligned.
      fireEvent.change(getReasonInput(), { target: { value: "   " } });
      expect(getSaveButton()).not.toBeDisabled();
    });
  });

  describe("Save behavior", () => {
    test("clicking Save with a valid reason calls onSave(reason)", () => {
      const { onSave } = renderForm();
      fireEvent.change(getReasonInput(), {
        target: { value: "Client moving" },
      });
      fireEvent.click(getSaveButton());
      expect(onSave).toHaveBeenCalledWith("Client moving");
    });

    test("clicking Save with empty input calls onSave(undefined)", () => {
      const { onSave } = renderForm();
      fireEvent.click(getSaveButton());
      expect(onSave).toHaveBeenCalledWith(undefined);
    });

    test("passes the raw reason without trimming", () => {
      const { onSave } = renderForm();
      fireEvent.change(getReasonInput(), {
        target: { value: "  padded reason  " },
      });
      fireEvent.click(getSaveButton());
      expect(onSave).toHaveBeenCalledWith("  padded reason  ");
    });

    test("clicking Save while disabled (1-2 chars) does nothing", () => {
      const { onSave } = renderForm();
      fireEvent.change(getReasonInput(), { target: { value: "ab" } });
      fireEvent.click(getSaveButton());
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  test("clicking Cancel calls onCancel and does not save", () => {
    const { onSave, onCancel } = renderForm();
    fireEvent.click(getCancelButton());
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});
