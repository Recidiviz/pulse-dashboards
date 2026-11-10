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

import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";

import { USER_ROLE } from "~@idaho-th/shared";

import {
  useHousingProviderStore,
  useUserStore,
} from "../../datastores/IdahoTHStoreContext";
import { useResolveHousingProvider } from "../../hooks/housingProvider";
import { Spinner } from "../common/LoadingSpinner";
import * as Styled from "./HousingProviderGate.styles";
import { HousingProviderSelectionScreen } from "./HousingProviderSelectionScreen";

export interface HousingProviderGateProps {
  children: React.ReactNode;
}

const Resolving = () => (
  <Styled.ResolvingScreen role="status" aria-label="Loading your provider">
    <Spinner />
  </Styled.ResolvingScreen>
);

/**
 * Establishes which organization a provider is acting as before any
 * provider-scoped query runs.
 *
 * This is the primary path, not a fallback. Without it the applications list
 * query batches with the resolve query and is rejected before the organization
 * is known, so a single-organization user — whose organization the server
 * resolves perfectly well — would be bounced to the selection screen on every
 * cold load. Staff fall straight through: the resolve query is never enabled
 * for them and nothing here renders.
 */
export const HousingProviderGate: React.FC<HousingProviderGateProps> = observer(
  function HousingProviderGate({ children }) {
    const userStore = useUserStore();
    const housingProviderStore = useHousingProviderStore();
    const isProvider = userStore.user?.role === USER_ROLE.PROVIDER;

    const { data } = useResolveHousingProvider(isProvider);
    const { activeProviderId, mustSelectHousingProvider } =
      housingProviderStore;
    // A forced selection has cleared the identifier, so there is nothing to
    // go back to.
    const onBack = activeProviderId
      ? () => housingProviderStore.closeHousingProviderSelection()
      : undefined;

    const activeHousingProvider =
      data?.housingProviders.find(({ id }) => id === data?.activeProviderId) ??
      null;

    useEffect(() => {
      if (!isProvider || mustSelectHousingProvider) return;
      if (activeProviderId || !activeHousingProvider) return;
      housingProviderStore.setActiveHousingProvider(activeHousingProvider);
    }, [
      activeProviderId,
      isProvider,
      mustSelectHousingProvider,
      housingProviderStore,
      activeHousingProvider,
    ]);

    if (!isProvider) return <>{children}</>;

    // A revoked assignment pins the portal here until a fresh choice is made,
    // so it lands on the picker — or, with nothing left to pick, on the empty
    // state — rather than quietly re-resolving to some other organization.
    if (mustSelectHousingProvider) {
      return data ? (
        <HousingProviderSelectionScreen
          housingProviders={data.housingProviders}
          onBack={onBack}
        />
      ) : (
        <Resolving />
      );
    }

    if (activeProviderId) return <>{children}</>;

    // Also covers a failed resolve: the global handler has toasted it, and
    // showing the picker instead would claim the user has no organizations.
    if (!data) return <Resolving />;

    // Nothing resolved — or the server named an organization that is not in
    // the caller's own list, which is the same thing from here.
    if (!activeHousingProvider) {
      return (
        <HousingProviderSelectionScreen
          housingProviders={data.housingProviders}
        />
      );
    }

    // Resolved, but the effect above has not committed it to the store yet.
    // Holding the spinner for that one frame is what keeps every child query
    // behind the active-organization header.
    return <Resolving />;
  },
);
