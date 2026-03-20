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
import { vi } from "vitest";

import { PopulationFilter } from "../../../";
import RadioGroup from "../RadioGroup";

const mockFilter: PopulationFilter = {
  type: "timePeriod",
  title: "Time Period",
  isSingleSelect: true,
  options: [
    { label: "6 months", value: "6" },
    { label: "1 year", value: "12" },
    { label: "2 years", value: "24" },
  ],
  setFilters: vi.fn(),
  defaultOption: { label: "6 months", value: "6" },
  defaultValue: "6",
};

describe("RadioGroup", () => {
  let onChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onChange = vi.fn();
  });

  it("renders all options", () => {
    render(
      <RadioGroup filter={mockFilter} defaultValue="6" onChange={onChange} />,
    );

    expect(screen.getByText("6 months")).toBeInTheDocument();
    expect(screen.getByText("1 year")).toBeInTheDocument();
    expect(screen.getByText("2 years")).toBeInTheDocument();
  });

  it("checks the default option", () => {
    render(
      <RadioGroup filter={mockFilter} defaultValue="6" onChange={onChange} />,
    );

    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toBeChecked();
    expect(radios[1]).not.toBeChecked();
    expect(radios[2]).not.toBeChecked();
  });

  it("calls onChange with selected option when a radio is clicked", () => {
    render(
      <RadioGroup filter={mockFilter} defaultValue="6" onChange={onChange} />,
    );

    fireEvent.click(screen.getAllByRole("radio")[1]);

    expect(onChange).toHaveBeenCalledWith(
      [{ value: "12", label: "1 year" }],
      "timePeriod",
    );
  });

  it("updates the checked state when a different option is selected", () => {
    render(
      <RadioGroup filter={mockFilter} defaultValue="6" onChange={onChange} />,
    );

    fireEvent.click(screen.getAllByRole("radio")[2]);

    const radios = screen.getAllByRole("radio");
    expect(radios[0]).not.toBeChecked();
    expect(radios[2]).toBeChecked();
  });

  it("groups radios by filter type name", () => {
    render(
      <RadioGroup filter={mockFilter} defaultValue="6" onChange={onChange} />,
    );

    const radios = screen.getAllByRole("radio");
    radios.forEach((radio) => {
      expect(radio).toHaveAttribute("name", "timePeriod");
    });
  });
});
