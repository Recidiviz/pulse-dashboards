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

import { Permission } from "~@jii/auth";
import { isDemoMode } from "~client-env-utils";

import { AuthManager } from "../apis/auth/AuthManager";
import { isAuthorizedState } from "../apis/auth/types";
import {
  SegmentClient,
  SegmentClientExternals,
} from "../apis/Segment/SegmentClient";
import { stateCodes, stateConfigsByUrlSlug } from "../configs/stateConstants";
import { StateCode } from "../configs/types";
import { TranslationStore } from "./TranslationStore";

export class UserStore {
  segmentClient: SegmentClient;

  authManager: AuthManager;

  constructor(translationStore: TranslationStore) {
    makeAutoObservable(
      this,
      { authManager: false, segmentClient: false },
      { autoBind: true },
    );

    this.authManager = new AuthManager(translationStore);

    this.segmentClient = new SegmentClient(new SegmentExternals(this));
  }

  private get authState() {
    return this.authManager.authState;
  }

  isAuthorizedForStateUrl(urlSlug: string): boolean {
    const activeStateCode = stateConfigsByUrlSlug[urlSlug]?.stateCode;

    if (activeStateCode && isAuthorizedState(this.authState)) {
      const { stateCode, allowedStates } = this.authState.userProfile;

      const isUserState = stateCode === activeStateCode;

      if (isUserState) return true;

      // various users (e.g. Recidiviz staff, tablet provider staff) may have
      // multi state access, at least in some environments
      const isAllowedState = allowedStates?.includes(activeStateCode);
      if (isAllowedState) return true;

      // for recidiviz users, assume blanket access to demo data
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
    return !!this.authManager.permissions?.includes(permission);
  }

  logOut() {
    this.authManager.authClient?.logOut();
  }

  identifyToTrackers() {
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

  get district(): string | undefined {
    if (isAuthorizedState(this.authState)) {
      return this.authState.userProfile.district || undefined;
    }
    return undefined;
  }
}

class SegmentExternals implements SegmentClientExternals {
  constructor(private userStore: UserStore) {}
  get isRecidivizUser() {
    return this.userStore.isRecidivizUser;
  }
}
