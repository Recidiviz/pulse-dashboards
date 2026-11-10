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

import { makeAutoObservable } from "mobx";

import type { HousingProviderOption } from "../interfaces/common";
import type { IdahoTHStore } from "./IdahoTHStore";

/**
 * The organization a provider user is currently acting as.
 *
 * This is the only place the active organization lives on the client. It is
 * read by the tRPC header callback and sent as a request header — never
 * written to a URL, a query parameter, or browser storage, so it cannot leak
 * into history, referrers or analytics. It dies with the tab, which is correct:
 * the durable copy is the preference column on the user's own record, written
 * by the `setActive` mutation and re-validated by the server on every request.
 */
export class HousingProviderStore {
  activeProviderId: string | null = null;

  /**
   * Set when the server refuses a request because no active organization can
   * be resolved. It pins the portal to the selection screen until the user
   * makes a fresh choice, so a revoked assignment lands on the picker rather
   * than silently re-resolving to some other organization.
   */
  mustSelectHousingProvider = false;

  constructor(public parent: IdahoTHStore) {
    makeAutoObservable(this);
  }

  setActiveHousingProvider(housingProvider: HousingProviderOption): void {
    this.activeProviderId = housingProvider.id;
    this.mustSelectHousingProvider = false;
  }

  /**
   * The user's own choice to open the picker. The active organization is left
   * in place, so backing out or re-picking it returns to the same cached data.
   */
  openHousingProviderSelection(): void {
    this.mustSelectHousingProvider = true;
  }

  closeHousingProviderSelection(): void {
    this.mustSelectHousingProvider = false;
  }

  /** Recovery for the dedicated forbidden error: drop the id, show the picker. */
  requireHousingProviderSelection(): void {
    this.activeProviderId = null;
    this.mustSelectHousingProvider = true;
  }

  reset(): void {
    this.activeProviderId = null;
    this.mustSelectHousingProvider = false;
  }
}
