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
import { axe } from "jest-axe";

import { semantics } from "../../../theme";
import { StatusMessage } from "../StatusMessage";

describe("StatusMessage", () => {
  it("shows the title, subtitle and actions", async () => {
    const { container } = render(
      <StatusMessage title="Nothing to show yet" subtitle="Add a month first.">
        <button type="button">Add month</button>
      </StatusMessage>,
    );

    expect(screen.getByText("Nothing to show yet")).toBeInTheDocument();
    expect(screen.getByText("Add a month first.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add month" }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders only the title when nothing else is given", () => {
    const { container } = render(<StatusMessage title="Unavailable" />);

    expect(container).toHaveTextContent(/^Unavailable$/);
  });

  it("draws the icon in the default icon colour and the text in the text colours", () => {
    render(
      <StatusMessage
        icon={<svg data-testid="icon" />}
        title="Unavailable"
        subtitle="Try again later."
      />,
    );

    expect(screen.getByTestId("icon").parentElement).toHaveStyleRule(
      "color",
      semantics.icon.default,
    );
    expect(screen.getByText("Unavailable")).toHaveStyleRule(
      "color",
      semantics.text.primary,
    );
    expect(screen.getByText("Try again later.")).toHaveStyleRule(
      "color",
      semantics.text.secondary,
    );
  });
});
