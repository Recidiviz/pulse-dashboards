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

import { FilterOption, PopulationFilter } from "../../../";
import CheckboxGroup from "../CheckboxGroup";
import CheckboxGroupWithSelectAllTitle from "../CheckboxGroupWithSelectAllTitle";

const mockSetFilters = vi.fn();

const mockFilter: PopulationFilter = {
  type: "race",
  title: "Race",
  options: [
    { label: "All", value: "ALL" },
    { label: "Black", value: "BLACK" },
    { label: "Hispanic", value: "HISPANIC" },
    { label: "White", value: "WHITE" },
  ],
  setFilters: mockSetFilters,
  defaultOption: { label: "All", value: "ALL" },
  defaultValue: "ALL",
};

const enabledOptions = mockFilter.options.slice(1);

describe("CheckboxGroup", () => {
  let onChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onChange = vi.fn();
  });

  it("renders all non-ALL options", () => {
    render(
      <CheckboxGroup
        filter={mockFilter}
        selectedOptions={enabledOptions}
        onChange={onChange}
      />,
    );

    expect(screen.getByText("Black")).toBeInTheDocument();
    expect(screen.getByText("Hispanic")).toBeInTheDocument();
    expect(screen.getByText("White")).toBeInTheDocument();
    expect(screen.queryByText("All")).not.toBeInTheDocument();
  });

  it("checks selected options", () => {
    const selected = [enabledOptions[0]]; // Black only
    render(
      <CheckboxGroup
        filter={mockFilter}
        selectedOptions={selected}
        onChange={onChange}
      />,
    );

    const blackCheckbox = screen.getByTestId("checkbox-BLACK");
    const hispanicCheckbox = screen.getByTestId("checkbox-HISPANIC");

    expect(blackCheckbox).toBeChecked();
    expect(hispanicCheckbox).not.toBeChecked();
  });

  it("calls onChange with added option when unchecked option is clicked", () => {
    const selected = [enabledOptions[0]]; // Black only
    render(
      <CheckboxGroup
        filter={mockFilter}
        selectedOptions={selected}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByTestId("checkbox-HISPANIC"));

    expect(onChange).toHaveBeenCalledWith(
      [enabledOptions[0], enabledOptions[1]],
      "race",
    );
  });

  it("calls onChange with option removed when checked option is clicked", () => {
    const selected = [enabledOptions[0], enabledOptions[1]]; // Black + Hispanic
    render(
      <CheckboxGroup
        filter={mockFilter}
        selectedOptions={selected}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByTestId("checkbox-BLACK"));

    expect(onChange).toHaveBeenCalledWith([enabledOptions[1]], "race");
  });

  it("falls back to all options when last option is unchecked", () => {
    const selected = [enabledOptions[0]]; // Black only
    render(
      <CheckboxGroup
        filter={mockFilter}
        selectedOptions={selected}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByTestId("checkbox-BLACK"));

    expect(onChange).toHaveBeenCalledWith(enabledOptions, "race");
  });
});

describe("CheckboxGroupWithSelectAllTitle", () => {
  let onChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onChange = vi.fn();
  });

  it("renders the filter title", () => {
    render(
      <CheckboxGroupWithSelectAllTitle
        filter={mockFilter}
        selectedOptions={enabledOptions}
        onChange={onChange}
      />,
    );

    expect(screen.getByText("Race")).toBeInTheDocument();
  });

  it("shows select-all checkbox as checked when all options are selected", () => {
    render(
      <CheckboxGroupWithSelectAllTitle
        filter={mockFilter}
        selectedOptions={enabledOptions}
        onChange={onChange}
      />,
    );

    const selectAll = screen.getByTestId("checkbox-select-all");
    expect(selectAll).toBeChecked();
  });

  it("shows select-all checkbox as unchecked when no options are selected", () => {
    render(
      <CheckboxGroupWithSelectAllTitle
        filter={mockFilter}
        selectedOptions={[]}
        onChange={onChange}
      />,
    );

    const selectAll = screen.getByTestId("checkbox-select-all");
    expect(selectAll).not.toBeChecked();
  });

  it("deselects all when select-all is clicked and all are selected", () => {
    render(
      <CheckboxGroupWithSelectAllTitle
        filter={mockFilter}
        selectedOptions={enabledOptions}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByTestId("checkbox-select-all"));

    expect(onChange).toHaveBeenCalledWith([] as FilterOption[], "race");
  });

  it("selects all when select-all is clicked and none are selected", () => {
    render(
      <CheckboxGroupWithSelectAllTitle
        filter={mockFilter}
        selectedOptions={[]}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByTestId("checkbox-select-all"));

    expect(onChange).toHaveBeenCalledWith(enabledOptions, "race");
  });

  it("selects all when select-all is clicked in indeterminate state", () => {
    const partial = [enabledOptions[0]]; // Only Black
    render(
      <CheckboxGroupWithSelectAllTitle
        filter={mockFilter}
        selectedOptions={partial}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByTestId("checkbox-select-all"));

    // Indeterminate -> clicking deselects all
    expect(onChange).toHaveBeenCalledWith([] as FilterOption[], "race");
  });
});
