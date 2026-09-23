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

import { comparer, IReactionDisposer, reaction } from "mobx";

import type { RootStore } from ".";

/**
 * Runs `onReset` whenever the current tenant or the signed-in user changes,
 * such as a switch between states or the start of an impersonation session.
 * Returns the reaction's disposer.
 *
 * @param rootStore - Store holding the tenant and user being watched.
 * @param onReset - Called on each change.
 */
export function resetOnTenantOrUserChange(
  rootStore: RootStore,
  onReset: () => void,
): IReactionDisposer {
  return reaction(
    () => ({
      tenant: rootStore.currentTenantId,
      user: rootStore.userStore.user,
    }),
    onReset,
    { equals: comparer.structural },
  );
}
