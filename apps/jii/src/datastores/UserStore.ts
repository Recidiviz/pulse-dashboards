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

import { AuthClient } from "~auth";
import {
  getAuth0Config,
  metadataNamespace,
  metadataSchema,
  Permission,
} from "~auth0-jii";
import { isOfflineMode } from "~client-env-utils";

import { StateCode } from "../configs/types";

export class UserStore {
  authClient: AuthClient<typeof metadataSchema>;

  constructor(private externals: { stateCode: StateCode }) {
    makeAutoObservable(this);

    this.authClient = new AuthClient(
      {
        ...getAuth0Config(import.meta.env["VITE_AUTH0_TENANT_KEY"]),
        redirect_uri: `${window.location.origin}/after-login`,
      },
      { metadataNamespace, metadataSchema },
    );
  }

  private externalIdOverride?: string;

  private get canOverrideExternalId() {
    return this.hasPermission("enhanced");
  }

  overrideExternalId(newId: string | undefined) {
    if (!this.canOverrideExternalId)
      throw new Error("You don't have permission to override external ID");
    this.externalIdOverride = newId;
  }

  get isAuthorizedForCurrentState(): boolean {
    if (isOfflineMode()) return true;

    const { stateCode, allowedStates } = this.authClient.appMetadata;
    return (
      (stateCode === this.externals.stateCode ||
        (stateCode === "RECIDIVIZ" &&
          allowedStates?.includes(this.externals.stateCode))) ??
      false
    );
  }

  get externalId(): string | undefined {
    // TODO(#5510): get this from auth0 for real users
    return this.externalIdOverride;
  }

  hasPermission(permission: Permission): boolean {
    if (isOfflineMode()) return true;

    return (
      this.authClient.appMetadata.permissions?.includes(permission) ?? false
    );
  }
}
