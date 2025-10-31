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

import { createInstance } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ChainedBackend from "i18next-chained-backend";
import resourcesToBackend from "i18next-resources-to-backend";

import { formatDateRangeFromTodayFormatter } from "./plugins/formatters/dateRangeFromToday";
import { formatDistanceFromTodayFormatter } from "./plugins/formatters/distanceFromToday";
import { fullDateFormatter } from "./plugins/formatters/fullDate";
import { monthYearFormatter } from "./plugins/formatters/monthYear";

export type SupportedLanguagesOption = Array<string> | "_ALL_";

/**
 * Generates a fresh i18next instance with our standard configuration (including plugins,
 * custom formatters, etc)
 * @param additionalLanguages if an array, members will be added on top of default English.
 * else if the magic keyword, no language restrictions will be applied
 * @returns a new i18next instance
 */
export function createI18nInstance(
  additionalLanguages: SupportedLanguagesOption,
) {
  const supportedLngs = Array.isArray(additionalLanguages)
    ? [
        ...additionalLanguages,
        // baseline/fallback language that states don't have to specify
        "en",
      ]
    : false;

  const newInstance = createInstance();
  newInstance
    .use(ChainedBackend)
    .use(LanguageDetector)
    .init({
      fallbackLng: "en",
      supportedLngs,
      // this lets missing langauges fall back to a base version, e.g. es-ES > es
      nonExplicitSupportedLngs: true,
      partialBundledLanguages: true,
      resources: {},
      interpolation: {
        // not needed for react as it escapes by default
        escapeValue: false,
      },
      detection: {
        // only Orijin devices use this
        lookupQuerystring: "locale",
      },
      backend: {
        backends: [
          // JSON is the standard and how we store externally managed translations
          resourcesToBackend(
            (language: string, namespace: string) =>
              import(`./namespaces/${namespace}/resources/${language}.json`),
          ),
          // if developing copy locally we may prefer to use typescript
          resourcesToBackend(
            (language: string, namespace: string) =>
              import(`./namespaces/${namespace}/resources/${language}.ts`),
          ),
        ],
      },
    });

  newInstance.services.formatter?.addCached(
    "formatFullDate",
    fullDateFormatter,
  );
  newInstance.services.formatter?.addCached(
    "formatMonthYear",
    monthYearFormatter,
  );
  newInstance.services.formatter?.addCached(
    "formatDistanceFromToday",
    formatDistanceFromTodayFormatter,
  );
  newInstance.services.formatter?.addCached(
    "formatDateRangeFromToday",
    formatDateRangeFromTodayFormatter,
  );

  return newInstance;
}
