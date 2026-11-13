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

import { CommunityReentryPlanInput } from "~datatypes";

import { resolveCommunityReentryPlan } from "../../../../../ParoleStore/report/communityReentryPlan";
import { MISSING_VALUE_TEXT } from "../report/constants";
import { AUTOSAVE_DELAY_MS } from "../report/useAutosavedText";
import {
  COMMUNITY_REENTRY_PLAN_BOXES,
  UsIdCommunityReentryPlanSection,
} from "../UsIdCommunityReentryPlanSection";

const HOUSING_TEXT = "Plans to live with a sibling.\n\nThe room is confirmed.";

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
  input?: CommunityReentryPlanInput;
}) {
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(
    <UsIdCommunityReentryPlanSection
      mode={mode}
      plan={resolveCommunityReentryPlan(input)}
      onSave={onSave}
    />,
  );
  return onSave;
}

describe("UsIdCommunityReentryPlanSection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the five boxes in order, each with its label and limit", () => {
    renderSection({});

    const boxes = screen.getAllByRole("textbox");
    expect(boxes.map((box) => box.getAttribute("aria-label"))).toEqual([
      "Housing",
      "Employment",
      "Aftercare / treatment plan",
      "Transportation",
      "Support network",
    ]);
    expect(boxes.map((box) => box.getAttribute("maxLength"))).toEqual([
      "1500",
      "1500",
      "1500",
      "1000",
      "1000",
    ]);
    expect(COMMUNITY_REENTRY_PLAN_BOXES).toHaveLength(5);
  });

  it("shows the PHI's saved text in its box and leaves the rest empty", () => {
    renderSection({ input: { fields: { housing: phiEdit(HOUSING_TEXT) } } });

    expect(screen.getByLabelText("Housing")).toHaveValue(HOUSING_TEXT);
    expect(screen.getByLabelText("Employment")).toHaveValue("");
  });

  it("saves a box's text to its own field after a pause in typing", async () => {
    const onSave = renderSection({});

    const box = screen.getByLabelText("Support network");
    fireEvent.focus(box);
    fireEvent.change(box, { target: { value: "A sibling and a mentor." } });
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));

    expect(onSave).toHaveBeenCalledWith(
      "supportNetwork",
      "A sibling and a mentor.",
    );
  });

  it("shows the text, and the missing-value text for empty boxes, in read mode", () => {
    renderSection({
      mode: "READ",
      input: { fields: { housing: phiEdit(HOUSING_TEXT) } },
    });

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Plans to live with a sibling/),
    ).toBeInTheDocument();
    expect(screen.getAllByText(MISSING_VALUE_TEXT)).toHaveLength(4);
  });
});
