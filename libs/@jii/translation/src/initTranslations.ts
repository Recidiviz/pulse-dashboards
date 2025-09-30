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

import i18nextDefaultInstance, { TFunction } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ChainedBackend from "i18next-chained-backend";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";

import { fullDateFormatter } from "./plugins/formatters/fullDate";
import { monthYearFormatter } from "./plugins/formatters/monthYear";

let initPromise: Promise<TFunction> | undefined = undefined;

export const initTranslations = () => {
  // prevent repeat init calls
  if (initPromise) return initPromise;

  initPromise = i18nextDefaultInstance
    .use(initReactI18next)
    .use(ChainedBackend)
    .use(LanguageDetector)
    .init({
      fallbackLng: "en",
      partialBundledLanguages: true,
      resources: {},
      interpolation: {
        // not needed for react as it escapes by default
        escapeValue: false,
      },
      detection: {
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

  i18nextDefaultInstance.services.formatter?.addCached(
    "formatFullDate",
    fullDateFormatter,
  );
  i18nextDefaultInstance.services.formatter?.addCached(
    "formatMonthYear",
    monthYearFormatter,
  );

  return initPromise;
};
