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

import { Card, CardSection } from "../Card.styles";

describe("Card", () => {
  it("renders children inside a row-direction card by default", () => {
    const { container } = render(
      <Card data-testid="card">
        <CardSection>Section A</CardSection>
        <CardSection>Section B</CardSection>
      </Card>,
    );

    const card = screen.getByTestId("card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveStyleRule("flex-direction", "row");
    expect(card).toHaveStyleRule(
      "border",
      expect.stringContaining("1px solid"),
    );
    expect(container.querySelectorAll("div").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("Section A")).toBeInTheDocument();
    expect(screen.getByText("Section B")).toBeInTheDocument();
  });

  it("uses column flex direction when stacked is true", () => {
    render(
      <Card data-testid="card" stacked>
        <CardSection>One</CardSection>
        <CardSection>Two</CardSection>
      </Card>,
    );

    const card = screen.getByTestId("card");
    expect(card).toHaveStyleRule("flex-direction", "column");
  });

  it("renders CardSection children", () => {
    render(
      <Card>
        <CardSection data-testid="section">Hello</CardSection>
      </Card>,
    );

    expect(screen.getByTestId("section")).toHaveTextContent("Hello");
  });
});
