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
import type { ReactNode } from "react";

import type { HousingProvider } from "~@idaho-th/client/interfaces/common";

import { SelectedProviderCard } from "../SelectedProviderCard";

// Inline, not portaled, so a click inside the modal bubbles to the card.
vi.mock("~@idaho-th/client/components/Modal/Modal", () => ({
  Modal: ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

const PROVIDER = {
  id: "provider-1",
  name: "Fake Provider",
  labels: [],
} as unknown as HousingProvider;

describe("SelectedProviderCard", () => {
  it("opens the provider details when the card is clicked", () => {
    const onSelect = vi.fn();
    render(
      <SelectedProviderCard
        provider={PROVIDER}
        onRemove={vi.fn()}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByText("Fake Provider"));

    expect(onSelect).toHaveBeenCalledWith("provider-1");
  });

  it("removes the provider through the modal without opening details", () => {
    const onRemove = vi.fn();
    const onSelect = vi.fn();
    render(
      <SelectedProviderCard
        provider={PROVIDER}
        onRemove={onRemove}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Remove Fake Provider" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove provider" }));

    expect(onRemove).toHaveBeenCalledWith("provider-1");
    expect(onSelect).not.toHaveBeenCalled();
  });
});
