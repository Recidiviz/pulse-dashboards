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

import { SelectedProviders } from "../SelectedProviders";

vi.mock("../../../../../assets/tabler-icon-bed.svg?react", () => ({
  default: () => <svg data-testid="bed-icon" />,
}));

vi.mock("../../SelectedProviderCard", () => ({
  SelectedProviderCard: () => <div data-testid="selected-provider-card" />,
}));

describe("SelectedProviders", () => {
  it("shows empty preferred-providers copy when none are selected", () => {
    render(
      <SelectedProviders
        selected={[]}
        onRemove={vi.fn()}
        onSelect={vi.fn()}
        hideEmptyState={false}
      />,
    );

    expect(screen.getByText("Selected Providers (0)")).toBeInTheDocument();
    expect(
      screen.getByText("No preferred providers found"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /The client didn't indicate any preferred providers, or we weren't able to match them/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders nothing when empty and hideEmptyState is true", () => {
    const { container } = render(
      <SelectedProviders
        selected={[]}
        onRemove={vi.fn()}
        onSelect={vi.fn()}
        hideEmptyState
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
