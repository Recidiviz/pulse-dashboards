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

import { ReportSelectInput } from "../ReportSelectInput";

const AGES = [15, 16, 17].map((age) => ({ value: age, label: String(age) }));

function renderSelect({
  value = null,
  disabled = false,
}: {
  value?: number | null;
  disabled?: boolean;
}) {
  const onChange = vi.fn();
  render(
    <ReportSelectInput
      value={value}
      onChange={onChange}
      options={AGES}
      label="Age of First Use"
      disabled={disabled}
    />,
  );
  return onChange;
}

describe("ReportSelectInput", () => {
  it("shows the placeholder and no clear button until an option is picked", () => {
    renderSelect({});

    expect(
      screen.getByRole("button", { name: "Age of First Use: Select" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Clear Age of First Use" }),
    ).not.toBeInTheDocument();
  });

  it("passes on the value of the option the PHI picks", () => {
    const onChange = renderSelect({});

    fireEvent.click(screen.getByRole("button", { name: /Select/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "16" }));

    expect(onChange).toHaveBeenCalledWith(16);
  });

  it("shows the picked option, and clears it to null", () => {
    const onChange = renderSelect({ value: 17 });

    expect(
      screen.getByRole("button", { name: "Age of First Use: 17" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Clear Age of First Use" }),
    );

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("can't be changed or cleared while disabled", () => {
    renderSelect({ value: 17, disabled: true });

    expect(
      screen.getByRole("button", { name: "Age of First Use: 17" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Clear Age of First Use" }),
    ).not.toBeInTheDocument();
  });
});
