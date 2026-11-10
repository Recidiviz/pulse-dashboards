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

import type { HousingProvider } from "~@idaho-th/client/interfaces/common";

import { SuggestionCard } from "../SuggestionCard";

const PROVIDER = {
  id: "provider-1",
  name: "Fake Provider",
  labels: [],
} as unknown as HousingProvider;

describe("SuggestionCard", () => {
  it("opens the provider details when the card is clicked", () => {
    const onAdd = vi.fn();
    const onSelect = vi.fn();
    render(
      <SuggestionCard provider={PROVIDER} onAdd={onAdd} onSelect={onSelect} />,
    );

    fireEvent.click(screen.getByText("Fake Provider"));

    expect(onSelect).toHaveBeenCalledWith("provider-1");
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("adds the provider without opening details when Add is clicked", () => {
    const onAdd = vi.fn();
    const onSelect = vi.fn();
    render(
      <SuggestionCard provider={PROVIDER} onAdd={onAdd} onSelect={onSelect} />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add Fake Provider to selected providers",
      }),
    );

    expect(onAdd).toHaveBeenCalledWith("provider-1");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("does nothing on card click when no onSelect is provided", () => {
    const onAdd = vi.fn();
    render(<SuggestionCard provider={PROVIDER} onAdd={onAdd} />);

    fireEvent.click(screen.getByText("Fake Provider"));

    expect(onAdd).not.toHaveBeenCalled();
  });
});
