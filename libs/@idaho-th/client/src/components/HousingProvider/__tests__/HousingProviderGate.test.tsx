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

import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { USER_ROLE } from "~@idaho-th/shared";

import {
  buildIdahoTHStore,
  renderWithStore,
} from "../../../test/renderWithStore";
import { HousingProviderGate } from "../HousingProviderGate";

type ResolveResult = {
  housingProviders: { id: string; name: string }[];
  activeProviderId: string | null;
};

const hooks = vi.hoisted(() => ({
  resolveEnabledWith: [] as boolean[],
  resolveData: undefined as ResolveResult | undefined,
  switchHousingProvider: vi.fn(),
}));

vi.mock("../../../hooks/housingProvider", () => ({
  useResolveHousingProvider: (enabled: boolean) => {
    hooks.resolveEnabledWith.push(enabled);
    return { data: enabled ? hooks.resolveData : undefined };
  },
  useSwitchHousingProvider: () => hooks.switchHousingProvider,
}));

const ORG_A = { id: "housing-provider-a", name: "Sunrise House" };
const ORG_B = { id: "housing-provider-b", name: "Lakeside Home" };

const PORTAL_CONTENT = "Applications queue";

function renderGate(store = buildIdahoTHStore({ role: USER_ROLE.PROVIDER })) {
  return renderWithStore(
    <HousingProviderGate>
      <div>{PORTAL_CONTENT}</div>
    </HousingProviderGate>,
    { store },
  );
}

beforeEach(() => {
  hooks.resolveEnabledWith = [];
  hooks.resolveData = undefined;
  hooks.switchHousingProvider.mockClear();
});

describe("HousingProviderGate", () => {
  describe("staff", () => {
    it("renders the page untouched and never asks the server for providers", () => {
      hooks.resolveData = { housingProviders: [], activeProviderId: null };

      renderGate(buildIdahoTHStore({ role: USER_ROLE.STAFF }));

      expect(screen.getByText(PORTAL_CONTENT)).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.queryByText(/choose a provider/i)).not.toBeInTheDocument();
      expect(hooks.resolveEnabledWith.every((enabled) => !enabled)).toBe(true);
    });
  });

  describe("resolving", () => {
    it("shows a spinner and withholds the page until the provider is known", () => {
      renderGate();

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.queryByText(PORTAL_CONTENT)).not.toBeInTheDocument();
    });
  });

  describe("a single provider", () => {
    it("opens straight to the portal on a cold load, with no prompt", () => {
      hooks.resolveData = {
        housingProviders: [ORG_A],
        activeProviderId: ORG_A.id,
      };

      const { store } = renderGate();

      expect(screen.getByText(PORTAL_CONTENT)).toBeInTheDocument();
      expect(screen.queryByText(/choose a provider/i)).not.toBeInTheDocument();
      // The identifier is in the store before the page renders, so every child
      // query carries the header.
      expect(store.housingProviderStore.activeProviderId).toBe(ORG_A.id);
    });
  });

  describe("several providers with nothing resolved", () => {
    it("shows the selection screen rather than the page", () => {
      hooks.resolveData = {
        housingProviders: [ORG_A, ORG_B],
        activeProviderId: null,
      };

      const { store } = renderGate();

      expect(screen.getByText(/choose a provider/i)).toBeInTheDocument();
      expect(screen.getByText(ORG_A.name)).toBeInTheDocument();
      expect(screen.getByText(ORG_B.name)).toBeInTheDocument();
      expect(screen.queryByText(PORTAL_CONTENT)).not.toBeInTheDocument();
      expect(store.housingProviderStore.activeProviderId).toBeNull();
    });

    it("hands the chosen provider to the switch path", async () => {
      hooks.resolveData = {
        housingProviders: [ORG_A, ORG_B],
        activeProviderId: null,
      };
      renderGate();

      await userEvent.click(screen.getByRole("button", { name: ORG_B.name }));

      expect(hooks.switchHousingProvider).toHaveBeenCalledWith(ORG_B);
    });
  });

  describe("no providers", () => {
    it("explains that none is assigned instead of erroring or looping", () => {
      hooks.resolveData = { housingProviders: [], activeProviderId: null };

      renderGate();

      expect(
        screen.getByText(/not assigned to a housing provider/i),
      ).toBeInTheDocument();
      expect(screen.queryByText(PORTAL_CONTENT)).not.toBeInTheDocument();
      expect(screen.queryByText(/choose a provider/i)).not.toBeInTheDocument();
    });
  });

  describe("the picker opened on an active provider", () => {
    it("offers Back, which returns to the portal without switching", async () => {
      hooks.resolveData = {
        housingProviders: [ORG_A, ORG_B],
        activeProviderId: ORG_A.id,
      };
      const store = buildIdahoTHStore({ role: USER_ROLE.PROVIDER });
      store.housingProviderStore.setActiveHousingProvider(ORG_A);
      store.housingProviderStore.openHousingProviderSelection();

      renderGate(store);
      expect(screen.getByText(/choose a provider/i)).toBeInTheDocument();

      await act(() =>
        userEvent.click(screen.getByRole("button", { name: /back/i })),
      );

      expect(screen.getByText(PORTAL_CONTENT)).toBeInTheDocument();
      expect(hooks.switchHousingProvider).not.toHaveBeenCalled();
      expect(store.housingProviderStore.activeProviderId).toBe(ORG_A.id);
    });
  });

  describe("an assignment revoked mid-session", () => {
    it("lands on the selection screen with the providers that remain", () => {
      hooks.resolveData = {
        housingProviders: [ORG_B],
        activeProviderId: ORG_B.id,
      };
      const store = buildIdahoTHStore({ role: USER_ROLE.PROVIDER });
      store.housingProviderStore.setActiveHousingProvider(ORG_A);
      // What the global error handler does on the dedicated forbidden message.
      store.housingProviderStore.requireHousingProviderSelection();

      renderGate(store);

      // Not the portal, even though one remaining assignment would otherwise
      // resolve on its own — the person chooses where they continue.
      expect(screen.getByText(/choose a provider/i)).toBeInTheDocument();
      expect(screen.getByText(ORG_B.name)).toBeInTheDocument();
      expect(screen.queryByText(PORTAL_CONTENT)).not.toBeInTheDocument();
      // The forced selection cleared the identifier, so there is nothing to go
      // back to and no way to dodge the choice.
      expect(screen.queryByRole("button", { name: /back/i })).toBeNull();
    });

    it("lands on the empty state when it was the only assignment", () => {
      hooks.resolveData = { housingProviders: [], activeProviderId: null };
      const store = buildIdahoTHStore({ role: USER_ROLE.PROVIDER });
      store.housingProviderStore.setActiveHousingProvider(ORG_A);
      store.housingProviderStore.requireHousingProviderSelection();

      renderGate(store);

      expect(
        screen.getByText(/not assigned to a housing provider/i),
      ).toBeInTheDocument();
      expect(screen.queryByText(PORTAL_CONTENT)).not.toBeInTheDocument();
    });
  });
});
