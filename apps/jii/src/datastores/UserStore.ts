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
import { z } from "zod";

import { Permission } from "~auth0-jii";
import { isDemoMode, isOfflineMode } from "~client-env-utils";

import { AuthManager } from "../apis/auth/AuthManager";
import { isAuthorizedState } from "../apis/auth/types";
import {
  SegmentClient,
  SegmentClientExternals,
} from "../apis/Segment/SegmentClient";
import { stateCodes, stateConfigsByUrlSlug } from "../configs/stateConstants";
import { StateCode } from "../configs/types";

export const USER_PROPERTY_KEYS = z.enum(["egtOnboardingSeen"]);
type UserPropertyKey = z.infer<typeof USER_PROPERTY_KEYS>;

export class UserStore {
  segmentClient: SegmentClient;

  authManager: AuthManager;

  constructor() {
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

  isAuthorizedForStateUrl(urlSlug: string): boolean {
    // for convenience we don't bother with this in offline mode
    if (isOfflineMode()) return true;

    const activeStateCode = stateConfigsByUrlSlug[urlSlug]?.stateCode;

    if (activeStateCode && isAuthorizedState(this.authState)) {
      const { stateCode, allowedStates } = this.authState.userProfile;

      const isUserState = stateCode === activeStateCode;

      if (isUserState) return true;

      // various users (e.g. Recidiviz staff, tablet provider staff) may have
      // multi state access, at least in some environments
      const isAllowedState = allowedStates?.includes(activeStateCode);
      if (isAllowedState) return true;

      // for recidiviz users, assume blanket access in demo mode
      if (stateCode === "RECIDIVIZ" && isDemoMode()) return true;
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

    return !!this.authManager.permissions?.includes(permission);
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

  get allowedStates(): Array<StateCode> {
    if (isAuthorizedState(this.authState)) {
      const userStateCodes = [
        this.authState.userProfile.stateCode,
        ...(this.authState.userProfile.allowedStates ?? []),
      ];
      // the reason we don't just return userStateCodes is to deduplicate values
      // and to narrow the type (userProfile "state codes" can be any string, e.g. "RECIDIVIZ")
      return stateCodes.options.filter((sc) => userStateCodes.includes(sc));
    }
    return [];
  }

  getUserProperty(key: UserPropertyKey) {
    return localStorage.getItem(key);
  }

  setUserProperty(key: UserPropertyKey, value: string) {
    localStorage.setItem(key, value);
  }
}

class SegmentExternals implements SegmentClientExternals {
  constructor(private userStore: UserStore) {}
  get isRecidivizUser() {
    return this.userStore.isRecidivizUser;
  }
}
