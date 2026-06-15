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

import { Pill } from "../Pill";

describe("Pill", () => {
  it("renders children and applies the required border color when not filled", () => {
    render(
      <Pill color="#ff0000" data-testid="pill">
        Status
      </Pill>,
    );
    const pill = screen.getByTestId("pill");
    expect(pill).toHaveTextContent("Status");
    expect(pill).toHaveStyle({ "border-color": "#ff0000" });
  });

  it("applies background-color when filled is true", () => {
    render(
      <Pill color="#00ff00" filled data-testid="pill">
        Filled
      </Pill>,
    );
    const pill = screen.getByTestId("pill");
    expect(pill).toHaveStyle({ "background-color": "#00ff00" });
  });

  it("uses provided textColor when set", () => {
    render(
      <Pill color="#0000ff" textColor="#abcdef" data-testid="pill">
        Custom Text
      </Pill>,
    );
    const pill = screen.getByTestId("pill");
    expect(pill).toHaveStyle({ color: "#abcdef" });
  });

  it("falls back to white text when filled has no textColor", () => {
    render(
      <Pill color="#123456" filled data-testid="pill">
        Filled White
      </Pill>,
    );
    const pill = screen.getByTestId("pill");
    expect(pill).toHaveStyle({ color: "rgb(255,255,255)" });
  });
});
