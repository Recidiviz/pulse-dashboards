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

import i18next from "i18next";
import { action, makeAutoObservable } from "mobx";

import { TRANSLATOR_MODE_LANGUAGE_CODE } from "~@jii/translation";

/**
 * Contains arbitrary bits of UI state that require centralized storage
 * for persistence or sharing between components
 */
export class UiStore {
  /**
   * Used to filter results on the search page, for users with access to it.
   * Storing it here will allow it to persist when navigating away from the page
   */
  selectedFacilityIdFilterOptionValue?: string;

  /**
   * Some components may wish to know how tall the sticky header is,
   * e.g. to ensure they don't scroll content past it to be covered up.
   * That value should be tracked and stored here, when applicable
   * (not all pages use this header).
   */
  stickyHeaderHeight = 0;

  /**
   * Controls header bar visibility, which other layout elements
   * may need to respond to independently. Changes in response to scroll events.
   */
  hideHeaderBar = false;

  /**
   * Will be synced in from i18next for observation
   */
  currentLanguage: string;

  /**
   * The most recent language used before activating translator mode,
   * to facilitate switching back to it
   */
  baseLanguageForTranslatorMode: string;

  constructor() {
    makeAutoObservable(this);

    const { language } = i18next;
    this.currentLanguage = language;

    // base defaults to English if we are starting in translator mode
    this.baseLanguageForTranslatorMode =
      language === TRANSLATOR_MODE_LANGUAGE_CODE ? "en" : this.currentLanguage;

    i18next.on(
      "languageChanged",
      action("update current language", (lng) => {
        this.currentLanguage = lng;
        if (lng !== TRANSLATOR_MODE_LANGUAGE_CODE) {
          this.baseLanguageForTranslatorMode = lng;
        }
      }),
    );
  }

  get isTranslatorModeActive() {
    return this.currentLanguage === TRANSLATOR_MODE_LANGUAGE_CODE;
  }

  set isTranslatorModeActive(value: boolean) {
    if (value) {
      i18next.changeLanguage(TRANSLATOR_MODE_LANGUAGE_CODE);
    } else {
      i18next.changeLanguage(this.baseLanguageForTranslatorMode);
    }
  }
}
