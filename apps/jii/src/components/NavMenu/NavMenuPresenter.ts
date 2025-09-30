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

import i18next from "i18next";
import { makeAutoObservable } from "mobx";

import { SimpleNavLinkProps } from "~@jii/common-ui";
import { UiStore, UserStore, windowIsIframe } from "~@jii/data";

export type MenuLinks = Array<SimpleNavLinkProps>;

export class NavMenuPresenter {
  constructor(
    public links: MenuLinks,
    private userStore: UserStore,
    private uiStore: UiStore,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  get showLogout(): boolean {
    // only an auth client enables logout functionality
    return (
      !!this.userStore.authManager.authClient &&
      // no logging out inside an iframe; we assume the parent window controls user session
      !windowIsIframe()
    );
  }

  get showTranslationMode(): boolean {
    return this.userStore.hasPermission("translator");
  }

  get isTranslationMode(): boolean {
    return this.uiStore.isTranslatorModeActive;
  }

  /**
   * This is a no-op if authClient is not defined
   */
  logOut() {
    this.userStore.authManager.authClient?.logOut();
  }

  toggleTranslationMode() {
    this.uiStore.isTranslatorModeActive = !this.uiStore.isTranslatorModeActive;
  }

  toggleActiveLanguage() {
    this.uiStore.isTranslatorModeActive = false;

    if (i18next.language.startsWith("es")) {
      i18next.changeLanguage("en");
    } else {
      i18next.changeLanguage("es");
    }
  }
}
