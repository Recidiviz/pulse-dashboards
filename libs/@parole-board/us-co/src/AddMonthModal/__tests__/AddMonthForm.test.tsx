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

import { useForm, useStore } from "@tanstack/react-form";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useState } from "react";
import ReactModal from "react-modal";

import type { YearMonthOption } from "~@parole-board/common";
import { addMonthChoices } from "~@parole-board/common/fixtures";
import { Modal } from "~design-system";

import { addMonthTiles } from "../../model/addMonthTiles";
import { AddMonthForm } from "../AddMonthForm";
import { countLocations, facilityPatternRows } from "../facilityPatternRows";

const PATTERNS = facilityPatternRows(
  addMonthChoices.currentPatterns,
  addMonthChoices.config.resources,
);

/** AddMonthForm on a TanStack Form, showing the field's value below it. */
function Form({
  options = addMonthChoices.options,
  initialSelected = ["2026-10"],
  disabled = false,
}: {
  options?: YearMonthOption[];
  initialSelected?: string[];
  disabled?: boolean;
}) {
  const [defaultValues] = useState({ months: initialSelected });
  const form = useForm({ defaultValues });
  const months = useStore(form.store, (state) => state.values.months);
  return (
    <>
      <form.Field name="months">
        {(field) => (
          <AddMonthForm
            tiles={addMonthTiles(options, addMonthChoices.currentMonth)}
            field={field}
            patterns={PATTERNS}
            locationCount={countLocations(addMonthChoices.currentPatterns)}
            disabled={disabled}
          />
        )}
      </form.Field>
      <output data-testid="months">{months.join(",")}</output>
    </>
  );
}

const tile = (name: RegExp) => screen.getByRole("checkbox", { name });
const patternsToggle = () =>
  screen.getByRole("button", { name: "Facility patterns · 37 locations" });

describe("AddMonthForm", () => {
  it("shows the design's copy", () => {
    render(<Form />);

    expect(
      screen.getByRole("heading", { name: "Add a month" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Select one or more months to draft. You can adjust the default facility patterns later.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Months to draft" }),
    ).toBeInTheDocument();
    expect(patternsToggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("shows the field's months as selected and writes each toggle back to it", async () => {
    render(<Form />);

    const checkboxes = within(
      screen.getByRole("group", { name: "Months to draft" }),
    ).getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(13);
    expect(
      checkboxes.filter((box) => (box as HTMLInputElement).checked),
    ).toEqual([checkboxes[0]]);

    await userEvent.click(tile(/^November/));
    expect(screen.getByTestId("months")).toHaveTextContent("2026-10,2026-11");

    await userEvent.click(tile(/^October 2026/));
    expect(screen.getByTestId("months")).toHaveTextContent(/^2026-11$/);
  });

  it("says every month exists with no options", () => {
    render(<Form options={[]} initialSelected={[]} />);

    expect(
      screen.getByText("Every month through October 2027 already exists."),
    ).toBeInTheDocument();
  });

  it("tabs from the tiles to the Facility patterns disclosure", async () => {
    render(<Form />);

    await userEvent.tab();
    expect(tile(/^October 2026/)).toHaveFocus();
    await userEvent.tab();
    expect(patternsToggle()).toHaveFocus();
  });

  it("moves between tiles with the arrow keys and toggles one with Space", async () => {
    render(<Form />);

    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    expect(tile(/^November/)).toHaveFocus();
    await userEvent.keyboard(" ");

    expect(screen.getByTestId("months")).toHaveTextContent("2026-10,2026-11");
  });

  it("disables the tiles while disabled and keeps the selection", () => {
    render(<Form initialSelected={["2026-11", "2026-12"]} disabled />);

    expect(tile(/^November/)).toBeDisabled();
    expect(tile(/^November/)).toBeChecked();
    expect(tile(/^January/)).toBeDisabled();
  });

  describe("in the Modal", () => {
    beforeAll(() => {
      ReactModal.setAppElement(document.createElement("div"));
    });

    it("has no axe violations with the patterns collapsed or open", async () => {
      render(
        <Modal isOpen contentLabel="Add a month">
          <Form />
        </Modal>,
      );
      const dialog = screen.getByRole("dialog", { name: "Add a month" });
      expect(await axe(dialog)).toHaveNoViolations();

      await userEvent.click(patternsToggle());
      expect(
        within(dialog).getByRole("list", { name: "Facility patterns" }),
      ).toBeInTheDocument();
      expect(await axe(dialog)).toHaveNoViolations();
    });
  });
});
