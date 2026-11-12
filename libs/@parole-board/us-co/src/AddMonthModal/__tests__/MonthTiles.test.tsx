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

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useState } from "react";

import { addMonthChoices } from "~@parole-board/common/fixtures";

import { addMonthTiles } from "../../model/addMonthTiles";
import { MonthTiles } from "../MonthTiles";

function Tiles({
  options = addMonthChoices.options,
  initialSelected = ["2026-10"],
  disabled = false,
  onChange,
}: {
  options?: { year: number; month: number }[];
  initialSelected?: string[];
  disabled?: boolean;
  onChange?: (selected: string[]) => void;
}) {
  const [selected, setSelected] = useState(initialSelected);
  return (
    <MonthTiles
      tiles={addMonthTiles(options, addMonthChoices.currentMonth)}
      // Shaped like the form.Field AddMonthModal passes.
      field={{
        name: "months",
        state: { value: selected },
        handleChange: (next) => {
          setSelected(next);
          onChange?.(next);
        },
      }}
      disabled={disabled}
    />
  );
}

const group = () => screen.getByRole("group", { name: "Months to draft" });
const tile = (name: RegExp) => screen.getByRole("checkbox", { name });

describe("MonthTiles", () => {
  it("lists each month with its year, in order", () => {
    render(<Tiles />);

    const checkboxes = within(group()).getAllByRole("checkbox");
    expect(checkboxes.map((box) => box.getAttribute("value"))).toEqual([
      "2026-10",
      "2026-11",
      "2026-12",
      "2027-01",
      "2027-02",
      "2027-03",
      "2027-04",
      "2027-05",
      "2027-06",
      "2027-07",
      "2027-08",
      "2027-09",
      "2027-10",
    ]);
    expect(checkboxes[0]).toHaveAccessibleName("October 2026");
    expect(checkboxes[3]).toHaveAccessibleName("January 2027");
  });

  it("selects a month on click and deselects it on a second click", async () => {
    const onChange = vi.fn();
    render(<Tiles onChange={onChange} />);

    await userEvent.click(tile(/^November/));
    expect(tile(/^November/)).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith(["2026-10", "2026-11"]);

    await userEvent.click(tile(/^November/));
    expect(tile(/^November/)).not.toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith(["2026-10"]);

    await userEvent.click(tile(/^October 2026/));
    expect(tile(/^October 2026/)).not.toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("toggles the focused month with Space", async () => {
    render(<Tiles />);

    await userEvent.tab();
    expect(tile(/^October 2026/)).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(tile(/^November/)).toHaveFocus();
    await userEvent.keyboard(" ");

    expect(tile(/^November/)).toBeChecked();
  });

  it("shows months that already exist as disabled Already added tiles", async () => {
    const onChange = vi.fn();
    render(
      <Tiles
        options={addMonthChoices.optionsWithSomeAdded}
        onChange={onChange}
      />,
    );

    for (const name of [/^November/, /^December/]) {
      expect(tile(name)).toBeDisabled();
      expect(tile(name)).toHaveAccessibleName(
        expect.stringMatching(/Already added$/),
      );
    }
    expect(tile(/^January/)).toHaveAccessibleName("January 2027");
    expect(tile(/^January/)).toBeEnabled();

    await userEvent.click(tile(/^November/));
    expect(tile(/^November/)).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables every tile while disabled and keeps the selection", () => {
    render(<Tiles initialSelected={["2026-11"]} disabled />);

    for (const checkbox of within(group()).getAllByRole("checkbox")) {
      expect(checkbox).toBeDisabled();
    }
    expect(tile(/^November/)).toBeChecked();
  });

  it("draws every tile at one height, with no label margin from the host", () => {
    // Bootstrap Reboot, which the staff app loads, gives labels a margin.
    const reboot = document.createElement("style");
    reboot.textContent = "label { margin-bottom: 8px; }";
    document.head.append(reboot);
    onTestFinished(() => reboot.remove());
    const { container } = render(
      <Tiles options={addMonthChoices.optionsWithSomeAdded} />,
    );

    const tiles = [...container.querySelectorAll(".ds-checkbox")];
    expect(tiles).toHaveLength(13);
    for (const element of tiles) {
      expect(getComputedStyle(element).height).toBe("3.5625rem");
      expect(
        getComputedStyle(element.querySelector("label") as Element)
          .marginBottom,
      ).toBe("0px");
    }
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Tiles options={addMonthChoices.optionsWithSomeAdded} />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
