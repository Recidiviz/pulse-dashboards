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

import { IntercomClient } from "../apis/Intercom/IntercomClient";
import {
  SegmentClient,
  SegmentClientExternals,
} from "../apis/Segment/SegmentClient";
import { StateCode } from "../configs/types";

export class UserStore {
  authClient: AuthClient<typeof metadataSchema>;

  intercomClient: IntercomClient;

  segmentClient: SegmentClient;

  constructor(private externals: { stateCode: StateCode }) {
    makeAutoObservable(this, {}, { autoBind: true });

    this.authClient = new AuthClient(
      {
        ...getAuth0Config(import.meta.env["VITE_AUTH_ENV"]),
        redirect_uri: `${window.location.origin}/after-login`,
      },
      { metadataNamespace, metadataSchema },
    );

    this.intercomClient = new IntercomClient();

    this.segmentClient = new SegmentClient(new SegmentExternals(this));
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
    try {
      return this.authClient.appMetadata.externalId;
    } catch {
      return undefined;
    }
  }

  get pseudonymizedId(): string | undefined {
    return this.authClient.appMetadata.pseudonymizedId;
  }

  hasPermission(permission: Permission): boolean {
    if (isOfflineMode()) return true;

    return (
      this.authClient.appMetadata.permissions?.includes(permission) ?? false
    );
  }

  logOut() {
    this.intercomClient.logOut();
    this.authClient.logOut();
  }

  identifyToTrackers() {
    if (isOfflineMode()) return;

    // non-JII users (e.g. Recidiviz employees) will not have this property
    if (this.pseudonymizedId) {
      this.segmentClient.identify(this.pseudonymizedId);

      this.intercomClient.updateUser({
        state_code: this.authClient.appMetadata.stateCode,
        user_id: this.pseudonymizedId,
        // schema requires that these fields will also exist
        user_hash: this.authClient.appMetadata.intercomUserHash as string,
        // referring directly to auth data in case this.externalId was locally overridden somehow
        external_id: this.authClient.appMetadata.externalId,
      });
    }
    // may be present in absence of external ID; use alternative identifiers if so
    else if (
      this.authClient.appMetadata.intercomUserHash &&
      this.authClient.userProperties?.sub
    ) {
      // we still want to enable intercom here but we will not identify the user to Segment,
      // since we can't guarantee that this ID has no PII in it (e.g. an email address).
      // this will not disable tracking, just keep the user anonymous
      this.intercomClient.updateUser({
        state_code: this.authClient.appMetadata.stateCode,
        user_hash: this.authClient.appMetadata.intercomUserHash,
        user_id: this.authClient.userProperties.sub,
        email: this.authClient.userProperties.email,
      });
    }
  }

  get isRecidivizUser(): boolean {
    try {
      return this.authClient.appMetadata.stateCode === "RECIDIVIZ";
    } catch {
      // appMetadata may throw if, e.g., a user isn't logged in yet. this is fine
      return false;
    }
  }

  get stateCode() {
    return this.externals.stateCode;
  }
}

class SegmentExternals implements SegmentClientExternals {
  constructor(private userStore: UserStore) {}
  get isRecidivizUser() {
    return this.userStore.isRecidivizUser;
  }

  get stateCode() {
    return this.userStore.stateCode;
  }
}
