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

import { GetTokenSilentlyOptions, LogoutOptions } from "@auth0/auth0-spa-js";
import { makeAutoObservable } from "mobx";

import { type SignInFlow, UserRole } from "~@idaho-th/shared";

import { HousingApplicationsStore } from "./HousingApplicationsStore";
import { HousingProviderStore } from "./HousingProviderStore";
import { PreviewModalStore } from "./PreviewModalStore";

export type AuthorizeOptions = {
  /**
   * When false, do not redirect to Auth0 if unauthenticated (used on /login).
   * @default true
   */
  redirectIfUnauthenticated?: boolean;
};

/**
 * Minimal shape of the host app's RootStore that this lib needs.
 * The host app's RootStore must satisfy this interface
 */
export interface RootStore {
  userStore: {
    isAuthorized: boolean;
    userIsLoading: boolean;
    authError?: Error;
    getToken?: (
      options?: GetTokenSilentlyOptions,
    ) => Promise<string | undefined> | undefined;
    authorize: (
      handleTargetUrl: (targetUrl: string) => void,
      options?: AuthorizeOptions,
    ) => Promise<void>;
    loginWithRedirect: () => Promise<void>;
    loginWithEmail: (email: string, flow: SignInFlow) => Promise<void>;
    logout?: (options?: LogoutOptions) => void;
    user?: {
      role?: UserRole;
      providerPseudonymizedId?: string | undefined;
      nickname?: string;
    };
  };
}

export class IdahoTHStore {
  rootStore: RootStore;

  housingApplicationsStore: HousingApplicationsStore;

  previewModalStore: PreviewModalStore;

  housingProviderStore: HousingProviderStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    this.housingApplicationsStore = new HousingApplicationsStore(this);
    this.previewModalStore = new PreviewModalStore(this);
    this.housingProviderStore = new HousingProviderStore(this);

    makeAutoObservable(this);
  }

  /**
   * Drops every piece of state that belongs to one organization.
   *
   * Called while switching organizations, before the new identifier takes
   * effect, so nothing selected or in flight under the previous organization
   * survives into the new one. The active organization is reset here too: that
   * is what makes the ordering observable, since setting the new identifier
   * first would leave the portal with no organization at all.
   */
  reset(): void {
    this.housingApplicationsStore.reset();
    this.previewModalStore.reset();
    this.housingProviderStore.reset();
  }
}
