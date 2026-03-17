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

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "styled-components";

import { defaultPathwaysTheme } from "../../PathwaysTheme";
import FiltersButton from "../FiltersButton";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={defaultPathwaysTheme}>{children}</ThemeProvider>
);

describe("FiltersButton", () => {
  it("renders the Filters button", () => {
    render(<FiltersButton />, { wrapper });

    expect(
      screen.getByRole("button", { name: /filters/i }),
    ).toBeInTheDocument();
  });

  it("opens the modal on click", () => {
    render(<FiltersButton />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: /filters/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Select Filters")).toBeInTheDocument();
  });

  it("closes the modal when close button is clicked", async () => {
    render(<FiltersButton />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: /filters/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Close modal"));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("toggles aria-expanded", () => {
    render(<FiltersButton />, { wrapper });

    const button = screen.getByRole("button", { name: /filters/i });
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("returns focus to the button on close", () => {
    render(<FiltersButton />, { wrapper });

    const button = screen.getByRole("button", { name: /filters/i });
    fireEvent.click(button);
    fireEvent.click(screen.getByLabelText("Close modal"));

    expect(button).toHaveFocus();
  });
});
