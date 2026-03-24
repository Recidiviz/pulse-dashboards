// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { SimpleNavLinkProps } from "~@jii/common-ui";
import {
  OfflineAuthHandler,
  OfflineUserId,
  offlineUsers,
  RootStore,
  windowIsIframe,
} from "~@jii/data";
import { isOfflineMode } from "~client-env-utils";
import { ResidentRecord } from "~datatypes";

export type MenuLinks = Array<SimpleNavLinkProps>;

export class NavMenuPresenter {
  constructor(
    public links: MenuLinks,
    private rootStore: RootStore,
    public readonly resident?: ResidentRecord,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  get personDisplayId(): string | undefined {
    return this.resident?.displayId;
  }

  get personName(): string | undefined {
    if (!this.resident) return undefined;
    return `${this.resident.personName.givenNames} ${this.resident.personName.surname}`;
  }

  get showLogout(): boolean {
    // only an auth client enables logout functionality
    return (
      !!this.rootStore.userStore.authManager.authClient &&
      // no logging out inside an iframe; we assume the parent window controls user session
      !windowIsIframe()
    );
  }

  get showTranslationMode(): boolean {
    return this.rootStore.userStore.hasPermission("translator");
  }

  get isTranslationMode(): boolean {
    return this.rootStore.translationStore.isTranslatorModeActive;
  }

  /**
   * This is a no-op if authClient is not defined
   */
  logOut() {
    this.rootStore.userStore.authManager.authClient?.logOut();
  }

  toggleTranslationMode() {
    this.rootStore.translationStore.isTranslatorModeActive =
      !this.rootStore.translationStore.isTranslatorModeActive;
  }

  // eventually we expect to support more than two languages; for now we can just toggle
  // English and Spanish for convenience
  toggleActiveLanguage() {
    this.rootStore.translationStore.isTranslatorModeActive = false;

    if (this.rootStore.translationStore.currentLanguage.startsWith("es")) {
      this.rootStore.translationStore.i18n.changeLanguage("en");
    } else {
      this.rootStore.translationStore.i18n.changeLanguage("es");
    }
  }

  private get offlineAuthHandler() {
    const handler = this.rootStore.userStore.authManager.handler;
    if (!isOfflineMode() || !(handler instanceof OfflineAuthHandler)) {
      return;
    }
    return handler;
  }

  get offlineUserOptions() {
    const { offlineAuthHandler } = this;
    if (!offlineAuthHandler) {
      return;
    }

    return Object.keys(offlineUsers).map((id) => ({
      // key type gets lost when mapping over an object
      id: id as OfflineUserId,
      active: id === offlineAuthHandler.activeUser.id,
    }));
  }

  setOfflineUser(id: OfflineUserId) {
    this.offlineAuthHandler?.setActiveUser(id);
  }
}
