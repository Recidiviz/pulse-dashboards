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

import { Permission } from "~auth0-jii";
import { isDemoMode, isOfflineMode } from "~client-env-utils";

import { AuthManager } from "../apis/auth/AuthManager";
import { isAuthorizedState } from "../apis/auth/types";
import {
  SegmentClient,
  SegmentClientExternals,
} from "../apis/Segment/SegmentClient";
import { StateCode } from "../configs/types";

export class UserStore {
  segmentClient: SegmentClient;

  authManager: AuthManager;

  constructor(private externals: { stateCode: StateCode }) {
    makeAutoObservable(
      this,
      { authManager: false, segmentClient: false },
      { autoBind: true },
    );

    this.authManager = new AuthManager();

    this.segmentClient = new SegmentClient(new SegmentExternals(this));
  }

  private get authState() {
    return this.authManager.authState;
  }

  get isAuthorizedForCurrentState(): boolean {
    if (isOfflineMode()) return true;

    if (isAuthorizedState(this.authState)) {
      const { stateCode, allowedStates } = this.authState.userProfile;

      const isUserState = stateCode === this.externals.stateCode;

      if (isUserState) return true;

      const isRecidivizUser = stateCode === "RECIDIVIZ";
      const isRecidivizAllowedState = allowedStates?.includes(
        this.externals.stateCode,
      );

      if (isRecidivizUser && (isDemoMode() || isRecidivizAllowedState))
        return true;
    }

    return false;
  }

  get externalId(): string | undefined {
    if (isAuthorizedState(this.authState)) {
      return this.authState.userProfile.externalId;
    }
    return undefined;
  }

  get pseudonymizedId(): string | undefined {
    if (isAuthorizedState(this.authState)) {
      return this.authState.userProfile.pseudonymizedId;
    }
    return undefined;
  }

  hasPermission(permission: Permission): boolean {
    if (isOfflineMode()) return true;

    if (isAuthorizedState(this.authState)) {
      return (
        this.authState.userProfile.permissions?.includes(permission) ?? false
      );
    }
    return false;
  }

  logOut() {
    this.authManager.authClient?.logOut();
  }

  identifyToTrackers() {
    if (isOfflineMode()) return;

    // non-JII users (e.g. Recidiviz employees) will not have this property
    if (this.pseudonymizedId) {
      this.segmentClient.identify(this.pseudonymizedId);
    }
  }

  get isRecidivizUser(): boolean {
    if (isAuthorizedState(this.authState)) {
      return this.authState.userProfile.stateCode === "RECIDIVIZ";
    }
    return false;
  }

  get stateCode() {
    return this.externals.stateCode;
  }

  get user() {
    if (isAuthorizedState(this.authState)) {
      return this.authState.userProfile;
    }
    return;
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
