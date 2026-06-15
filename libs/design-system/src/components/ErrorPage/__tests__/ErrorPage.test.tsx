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

import { ErrorPage } from "../ErrorPage";

describe("ErrorPage", () => {
  it("renders headerText, logo, and children", () => {
    render(
      <ErrorPage
        headerText="Something went wrong"
        logo={<svg data-testid="logo" />}
      >
        <p>Body content here</p>
      </ErrorPage>,
    );

    expect(screen.getByTestId("logo")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Something went wrong" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Body content here")).toBeInTheDocument();
  });

  it("accepts string nodes as the logo prop", () => {
    render(
      <ErrorPage headerText="Header" logo="LOGO_PLACEHOLDER">
        <span>child</span>
      </ErrorPage>,
    );
    expect(screen.getByText("LOGO_PLACEHOLDER")).toBeInTheDocument();
  });
});
