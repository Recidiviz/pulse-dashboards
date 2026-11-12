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

import { SummaryInput } from "~datatypes";

import { resolveSummary } from "../../../../../ParoleStore/report/summary";
import { MISSING_VALUE_TEXT } from "../report/constants";
import { AUTOSAVE_DELAY_MS } from "../report/useAutosavedText";
import { SUMMARY_MAX_LENGTH, UsIdSummarySection } from "../UsIdSummarySection";

const SUMMARY_TEXT =
  "Cooperative throughout the interview.\n\nPlans to live with family.";

const phiEdit = <T,>(value: T) => ({
  value,
  updatedBy: "phi@us_id.gov",
  updatedAt: new Date("2026-11-11T15:00:00Z"),
});

function renderSection({
  mode = "EDIT",
  input,
}: {
  mode?: "EDIT" | "READ";
  input?: SummaryInput;
}) {
  const onSaveSummary = vi.fn().mockResolvedValue(undefined);
  const onSaveWaiver = vi.fn().mockResolvedValue(undefined);
  render(
    <UsIdSummarySection
      mode={mode}
      summary={resolveSummary(input)}
      onSaveSummary={onSaveSummary}
      onSaveWaiver={onSaveWaiver}
    />,
  );
  return { onSaveSummary, onSaveWaiver };
}

describe("UsIdSummarySection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows an empty summary box", () => {
    renderSection({});

    const box = screen.getByLabelText("Summary");
    expect(box).toHaveValue("");
    expect(box).toHaveAttribute("maxLength", String(SUMMARY_MAX_LENGTH));
    expect(
      screen.getByRole("button", { name: "4th Amendment Waiver: Select" }),
    ).toBeInTheDocument();
  });

  it("shows the waiver statement with no title or pronoun for the resident", () => {
    renderSection({});

    expect(
      screen.getByText(/The resident indicated understanding and acceptance/),
    ).toBeInTheDocument();
  });

  it("shows the PHI's saved summary and waiver answer", () => {
    renderSection({
      input: {
        fields: {
          summary: phiEdit(SUMMARY_TEXT),
          fourthAmendmentWaiver: phiEdit("YES"),
        },
      },
    });

    expect(screen.getByLabelText("Summary")).toHaveValue(SUMMARY_TEXT);
    expect(
      screen.getByRole("button", { name: "4th Amendment Waiver: Yes" }),
    ).toBeInTheDocument();
  });

  it("saves the summary after a pause in typing", async () => {
    const { onSaveSummary } = renderSection({});

    const box = screen.getByLabelText("Summary");
    fireEvent.focus(box);
    fireEvent.change(box, { target: { value: "Cooperative throughout." } });
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));

    expect(onSaveSummary).toHaveBeenCalledWith("Cooperative throughout.");
  });

  it("saves the waiver answer the PHI picks", async () => {
    const { onSaveWaiver } = renderSection({});

    fireEvent.click(screen.getByRole("button", { name: /Select/ }));
    await act(async () => {
      fireEvent.click(screen.getByText("No, interview was not conducted"));
    });

    expect(onSaveWaiver).toHaveBeenCalledWith("INTERVIEW_NOT_CONDUCTED");
  });

  it("shows the summary and waiver answer as text in read mode", () => {
    renderSection({
      mode: "READ",
      input: { fields: { fourthAmendmentWaiver: phiEdit("YES") } },
    });

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(MISSING_VALUE_TEXT)).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
  });
});
