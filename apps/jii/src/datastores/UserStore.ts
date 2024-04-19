// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { isOfflineMode, isTestEnv } from "~client-env-utils";

export class UserStore {
  constructor() {
    makeAutoObservable(this);
  }

  private externalIdOverride?: string;

  private get canOverrideExternalId() {
    if (isTestEnv() || isOfflineMode()) return true;

    // eventually recidiviz users only should be able to do this in the live app
    return false;
  }

  overrideExternalId(newId: string | undefined) {
    if (!this.canOverrideExternalId)
      throw new Error("You don't have permission to override external ID");
    this.externalIdOverride = newId;
  }

  get externalId(): string | undefined {
    // TODO(#5021): get this from auth0 for real users
    return this.externalIdOverride;
  }
}
