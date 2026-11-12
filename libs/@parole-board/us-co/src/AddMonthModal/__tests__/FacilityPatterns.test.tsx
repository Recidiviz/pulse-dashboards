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

import { addMonthChoices } from "~@parole-board/common/fixtures";

import { facilityPatternRows } from "../facilityPatternRows";
import { type FacilityPatternRow, FacilityPatterns } from "../FacilityPatterns";

const ROWS: FacilityPatternRow[] = facilityPatternRows(
  addMonthChoices.currentPatterns,
  addMonthChoices.config.resources,
);

const toggle = () =>
  screen.getByRole("button", { name: "Facility patterns · 37 locations" });

describe("FacilityPatterns", () => {
  it("starts collapsed, with the location count", () => {
    render(<FacilityPatterns patterns={ROWS} locationCount={37} />);

    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(toggle()).toHaveTextContent("Show");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("opens and closes the list it controls", async () => {
    render(<FacilityPatterns patterns={ROWS} locationCount={37} />);

    await userEvent.click(toggle());

    const list = screen.getByRole("list", { name: "Facility patterns" });
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    expect(toggle()).toHaveAttribute("aria-controls", list.id);
    expect(toggle()).toHaveTextContent("Hide");

    await userEvent.click(toggle());

    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("opens with the keyboard", async () => {
    render(<FacilityPatterns patterns={ROWS} locationCount={37} />);

    await userEvent.tab();
    expect(toggle()).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    expect(toggle()).toHaveAttribute("aria-expanded", "true");
  });

  it("lists each row's name and days in order, ending with the meetings", () => {
    render(<FacilityPatterns patterns={ROWS} locationCount={37} defaultOpen />);

    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(39);
    expect(items[0]).toHaveTextContent("FCF — Fremont1st and 2nd Monday");
    expect(items[37]).toHaveTextContent("Full BoardEvery Friday");
    expect(items[38]).toHaveTextContent("Business MtgNo pattern");
  });

  it("names a single location in the singular", () => {
    render(<FacilityPatterns patterns={ROWS.slice(0, 1)} locationCount={1} />);

    expect(
      screen.getByRole("button", { name: "Facility patterns · 1 location" }),
    ).toBeInTheDocument();
  });

  it("has no axe violations collapsed or open", async () => {
    const { container } = render(
      <FacilityPatterns patterns={ROWS} locationCount={37} />,
    );
    expect(await axe(container)).toHaveNoViolations();

    await userEvent.click(toggle());
    expect(await axe(container)).toHaveNoViolations();
  });
});
