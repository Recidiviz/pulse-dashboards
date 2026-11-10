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

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { HousingProvider } from "~@idaho-th/client/interfaces/common";

import { renderWithStore } from "../../../../../test/renderWithStore";
import { SelectProviderModal } from "../SelectProviderModal";

vi.mock("../../../../assets/x.svg?react", () => ({
  default: () => <svg data-testid="x-icon" />,
}));

vi.mock("../../../../Modal/Modal", () => ({
  Modal: ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

function provider(overrides: Partial<HousingProvider> = {}): HousingProvider {
  return {
    id: "provider-1",
    name: "Example House",
    providerLocation: null,
    labels: [],
    isPreferred: false,
    ...overrides,
  } as unknown as HousingProvider;
}

let onClose: ReturnType<typeof vi.fn>;
let onSelectProvider: ReturnType<typeof vi.fn>;

beforeEach(() => {
  onClose = vi.fn();
  onSelectProvider = vi.fn();
});

function renderModal(
  props: Partial<Parameters<typeof SelectProviderModal>[0]> = {},
) {
  return renderWithStore(
    <SelectProviderModal
      isOpen
      onClose={onClose}
      onSelectProvider={onSelectProvider}
      providers={[provider()]}
      isLoading={false}
      isError={false}
      {...props}
    />,
  );
}

describe("SelectProviderModal", () => {
  it("renders nothing while closed", () => {
    renderModal({ isOpen: false });

    expect(
      screen.queryByText("Select Home Plan Provider"),
    ).not.toBeInTheDocument();
  });

  it("lists the eligible providers with a way to pick each one", () => {
    renderModal({
      providers: [
        provider(),
        provider({ id: "provider-2", name: "Second House" }),
      ],
    });

    expect(screen.getByText("Select Home Plan Provider")).toBeInTheDocument();
    expect(screen.getByText("Example House")).toBeInTheDocument();
    expect(screen.getByText("Second House")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Set as Home Plan" }),
    ).toHaveLength(2);
  });

  it("reports the provider that was picked", async () => {
    const user = userEvent.setup();
    const second = provider({ id: "provider-2", name: "Second House" });
    renderModal({ providers: [provider(), second] });

    await user.click(
      screen.getAllByRole("button", {
        name: "Set as Home Plan",
      })[1] as HTMLElement,
    );

    expect(onSelectProvider).toHaveBeenCalledWith(second);
  });

  it("closes from the header button", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Close modal" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes from the footer button", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows no provider list while loading", () => {
    renderModal({ isLoading: true, providers: [] });

    expect(screen.getByText("Select Home Plan Provider")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Set as Home Plan" }),
    ).not.toBeInTheDocument();
  });

  it("reports a load failure instead of an empty list", () => {
    renderModal({ isError: true, providers: [] });

    expect(
      screen.getByText("Failed to load eligible providers. Please try again."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Set as Home Plan" }),
    ).not.toBeInTheDocument();
  });

  it("prefers the error message over a stale provider list", () => {
    renderModal({ isError: true, providers: [provider()] });

    expect(
      screen.getByText("Failed to load eligible providers. Please try again."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Example House")).not.toBeInTheDocument();
  });

  describe("with no eligible providers", () => {
    it("explains why the list is empty rather than showing a blank modal", () => {
      renderModal({ providers: [] });

      expect(screen.getByText("No eligible providers")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Providers must submit an approval before they can be selected.",
        ),
      ).toBeInTheDocument();
    });

    it("offers only a way out", async () => {
      const user = userEvent.setup();
      renderModal({ providers: [] });

      expect(
        screen.queryByRole("button", { name: "Cancel" }),
      ).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Close" }));

      expect(onClose).toHaveBeenCalled();
      expect(onSelectProvider).not.toHaveBeenCalled();
    });
  });
});
