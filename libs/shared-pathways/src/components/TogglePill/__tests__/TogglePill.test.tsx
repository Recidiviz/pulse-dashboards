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

import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { vi } from "vitest";

import { defaultPathwaysTheme } from "../../PathwaysTheme";
import { TogglePill } from "../TogglePill";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={defaultPathwaysTheme}>{children}</ThemeProvider>
);

describe("TogglePill", () => {
  const renderTogglePill = () => {
    return render(
      <TogglePill
        currentValue="left"
        leftPill={{ label: "Left", value: "left" }}
        rightPill={{ label: "Right", value: "right" }}
        onChange={vi.fn()}
      />,
      { wrapper },
    );
  };

  it("should render two radio buttons", () => {
    renderTogglePill();
    const buttons = screen.getAllByRole("radio");
    expect(buttons).toHaveLength(2);
  });

  it("should have one option checked", () => {
    renderTogglePill();
    const buttons = screen.getAllByRole("radio");
    const checked = buttons.filter(
      (b) => b.getAttribute("aria-checked") === "true",
    );
    expect(checked).toHaveLength(1);
  });
});
