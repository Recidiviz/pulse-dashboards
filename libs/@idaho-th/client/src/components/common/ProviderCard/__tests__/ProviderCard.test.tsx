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

import { ProviderCard } from "../ProviderCard";

vi.mock("../../../assets/pin-icon.svg?react", () => ({
  default: () => <svg />,
}));

describe("ProviderCard", () => {
  it("does not render the Preferred badge when isPreferred is falsy", () => {
    render(<ProviderCard name="Hope Housing" />);
    expect(screen.queryByText("Preferred")).not.toBeInTheDocument();
  });

  it("renders the Preferred badge when isPreferred is true", () => {
    render(<ProviderCard name="Hope Housing" isPreferred />);
    expect(screen.getByText("Preferred")).toBeInTheDocument();
  });

  it("renders description, belowDescription, and trailing nodes", () => {
    render(
      <ProviderCard
        name="Hope Housing"
        description="Men only"
        belowDescription={<div>Additional</div>}
        trailing={<button type="button">Remove</button>}
      />,
    );

    expect(screen.getByText("Hope Housing")).toBeInTheDocument();
    expect(screen.getByText("Men only")).toBeInTheDocument();
    expect(screen.getByText("Additional")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });
});
