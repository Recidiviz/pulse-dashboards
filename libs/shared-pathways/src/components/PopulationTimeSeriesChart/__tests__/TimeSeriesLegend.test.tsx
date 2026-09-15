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

import { defaultPathwaysTheme } from "../../PathwaysTheme";
import TimeSeriesLegend from "../TimeSeriesLegend";

describe("TimeSeriesLegend", () => {
  it("names every line it is given", () => {
    render(
      <ThemeProvider theme={defaultPathwaysTheme}>
        <TimeSeriesLegend
          items={[
            { name: "Admissions", color: "#1F4E6D" },
            { name: "Releases", color: "#D4A017" },
          ]}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText("Admissions")).toBeInTheDocument();
    expect(screen.getByText("Releases")).toBeInTheDocument();
  });

  it("hides the color swatches from assistive technology", () => {
    const { container } = render(
      <ThemeProvider theme={defaultPathwaysTheme}>
        <TimeSeriesLegend items={[{ name: "Admissions", color: "#1F4E6D" }]} />
      </ThemeProvider>,
    );

    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  });
});
