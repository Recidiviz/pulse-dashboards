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
import { format } from "date-fns";

import { ChooseSnapshotStep } from "../ChooseSnapshotStep";

describe("ChooseSnapshotStep", () => {
  const noop = () => {
    // intentionally empty for tests that don't assert on this callback
  };

  it("renders the title, subheading, and info banner", () => {
    render(
      <ChooseSnapshotStep
        snapshotOption={undefined}
        onSnapshotOptionChange={noop}
        selectedDate={null}
        onSelectedDateChange={noop}
        onCancel={noop}
        onContinue={noop}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Individual-level data" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Choose the monthly snapshot\(s\) to export/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This dataset is completely unfiltered/),
    ).toBeInTheDocument();
  });

  it("disables Continue until an option is chosen", () => {
    const onSnapshotOptionChange = vi.fn();
    render(
      <ChooseSnapshotStep
        snapshotOption={undefined}
        onSnapshotOptionChange={onSnapshotOptionChange}
        selectedDate={null}
        onSelectedDateChange={noop}
        onCancel={noop}
        onContinue={noop}
      />,
    );

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    fireEvent.click(screen.getByText("Every month, last 5 years"));
    expect(onSnapshotOptionChange).toHaveBeenCalledWith("bulk");
  });

  it("only shows the month/year picker once the single-snapshot option is chosen", () => {
    const { rerender } = render(
      <ChooseSnapshotStep
        snapshotOption={undefined}
        onSnapshotOptionChange={noop}
        selectedDate={null}
        onSelectedDateChange={noop}
        onCancel={noop}
        onContinue={noop}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Previous year" }),
    ).not.toBeInTheDocument();

    rerender(
      <ChooseSnapshotStep
        snapshotOption="bulk"
        onSnapshotOptionChange={noop}
        selectedDate={null}
        onSelectedDateChange={noop}
        onCancel={noop}
        onContinue={noop}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Previous year" }),
    ).not.toBeInTheDocument();

    rerender(
      <ChooseSnapshotStep
        snapshotOption="single"
        onSnapshotOptionChange={noop}
        selectedDate={null}
        onSelectedDateChange={noop}
        onCancel={noop}
        onContinue={noop}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Previous year" }),
    ).toBeInTheDocument();
  });

  it("picking a month updates the selected date", () => {
    const onSelectedDateChange = vi.fn();
    render(
      <ChooseSnapshotStep
        snapshotOption="single"
        onSnapshotOptionChange={noop}
        selectedDate={null}
        onSelectedDateChange={onSelectedDateChange}
        onCancel={noop}
        onContinue={noop}
      />,
    );

    const currentMonthLabel = format(new Date(), "MMM");
    fireEvent.click(screen.getByText(currentMonthLabel));

    expect(onSelectedDateChange).toHaveBeenCalled();
  });

  it("keeps Continue disabled for the single-snapshot option until a date is picked", () => {
    render(
      <ChooseSnapshotStep
        snapshotOption="single"
        onSnapshotOptionChange={noop}
        selectedDate={null}
        onSelectedDateChange={noop}
        onCancel={noop}
        onContinue={noop}
      />,
    );

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("enables Continue for the single-snapshot option once a date is picked", () => {
    render(
      <ChooseSnapshotStep
        snapshotOption="single"
        onSnapshotOptionChange={noop}
        selectedDate={new Date(2024, 2, 1)}
        onSelectedDateChange={noop}
        onCancel={noop}
        onContinue={noop}
      />,
    );

    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("disables navigating the calendar to years before the 5-year minimum", () => {
    render(
      <ChooseSnapshotStep
        snapshotOption="single"
        onSnapshotOptionChange={noop}
        selectedDate={null}
        onSelectedDateChange={noop}
        onCancel={noop}
        onContinue={noop}
      />,
    );

    const prevYearButton = screen.getByRole("button", {
      name: "Previous year",
    });

    for (let i = 0; i < 8 && !prevYearButton.hasAttribute("disabled"); i++) {
      fireEvent.click(prevYearButton);
    }

    expect(prevYearButton).toBeDisabled();
  });

  it("selects an option by clicking its container, even when a different option is already selected", () => {
    const onSnapshotOptionChange = vi.fn();
    render(
      <ChooseSnapshotStep
        snapshotOption="single"
        onSnapshotOptionChange={onSnapshotOptionChange}
        selectedDate={null}
        onSelectedDateChange={noop}
        onCancel={noop}
        onContinue={noop}
      />,
    );

    fireEvent.click(screen.getByTestId("snapshot-option-row-bulk"));

    expect(onSnapshotOptionChange).toHaveBeenCalledWith("bulk");
  });

  it("calls onCancel and onContinue", () => {
    const onCancel = vi.fn();
    const onContinue = vi.fn();
    render(
      <ChooseSnapshotStep
        snapshotOption="bulk"
        onSnapshotOptionChange={noop}
        selectedDate={null}
        onSelectedDateChange={noop}
        onCancel={onCancel}
        onContinue={onContinue}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinue).toHaveBeenCalled();
  });
});
