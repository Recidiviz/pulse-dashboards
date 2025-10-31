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

import type { i18n } from "i18next";
import { action, makeAutoObservable } from "mobx";

import {
  SupportedLanguagesOption,
  TRANSLATOR_MODE_LANGUAGE_CODE,
} from "~@jii/translation";
import { createI18nInstance } from "~@jii/translation";

import { TranslationConfig } from "../configs/types";
import { UserStore } from "./UserStore";

export class TranslationStore {
  /**
   * When translation config is changed by calling {@link TranslationStore.updateI18n}
   * (e.g. when navigating to into a state's routes), this entire instance will be replaced
   * by a new one with the new configuration. Use MobX to observe and react to these changes,
   * but in general you should be accessing translations via React hooks rather than accessing
   * this object directly.
   */
  i18n: i18n;

  /**
   * Observable value synced from i18next instance, for convenience
   */
  currentLanguage: string;

  /**
   * The most recent language used before activating translator mode,
   * to facilitate switching back to it
   */
  baseLanguageForTranslatorMode: string;

  constructor(private externals: { userStore: UserStore }) {
    makeAutoObservable(this);

    // initialize with an unrestricted instance. In real-world usage this will be
    // almost immediately replaced with a state-specific instance, but this can handle
    // common pages and initial UI states and using an unrestricted instance avoids
    // clobbering any incoming or cached detected language preferences
    this.i18n = this.getNewI18nInstance();

    this.currentLanguage = this.i18n.language;

    // base defaults to English if we are starting in translator mode
    this.baseLanguageForTranslatorMode =
      this.currentLanguage === TRANSLATOR_MODE_LANGUAGE_CODE
        ? "en"
        : this.currentLanguage;
  }

  /**
   * Calling this without a config will create a generic (unrestricted) instance,
   * useful as a fallback when state-specific config is not yet available
   */
  private getNewI18nInstance(config?: TranslationConfig) {
    let languages: SupportedLanguagesOption = "_ALL_";
    // translator permission lets you override state language restrictions,
    // e.g. to preview languages that are still in development
    if (config && !this.externals.userStore.hasPermission("translator")) {
      languages = config.additionalLanguages;
    }

    const i18n = createI18nInstance(languages);

    i18n.on(
      "languageChanged",
      action("update base language", (lng) => {
        // sync new value to mobx observables
        this.currentLanguage = lng;
        if (lng !== TRANSLATOR_MODE_LANGUAGE_CODE) {
          this.baseLanguageForTranslatorMode = lng;
        }
      }),
    );

    return i18n;
  }

  /**
   * Replaces the existing i18n instance with a new one. We do this because i18n configuration
   * can generally only be set during initialization, and we need the translation configuration
   * to vary by state. The majority of configuration is actually shared across states, but it
   * will be supplemented by whatever is passed to this method.
   */
  updateI18n(config: TranslationConfig) {
    this.i18n = this.getNewI18nInstance(config);
    this.currentLanguage = this.i18n.language;
  }

  get isTranslatorModeActive() {
    return !!(
      this.externals.userStore.hasPermission("translator") &&
      this.currentLanguage === TRANSLATOR_MODE_LANGUAGE_CODE
    );
  }

  set isTranslatorModeActive(value: boolean) {
    if (value && this.externals.userStore.hasPermission("translator")) {
      this.i18n.changeLanguage(TRANSLATOR_MODE_LANGUAGE_CODE);
    } else {
      this.i18n.changeLanguage(this.baseLanguageForTranslatorMode);
    }
  }
}
