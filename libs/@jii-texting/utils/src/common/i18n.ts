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

import i18next from "i18next";

/* eslint-disable no-restricted-imports */
import englishMessages from "../locales/en/messages.json";
import spanishMessages from "../locales/es/messages.json";
/* eslint-enable no-restricted-imports */

export const i18nInstance = i18next;

export async function initI18n() {
  await i18next.init({
    lng: "en",
    resources: {
      en: { translation: englishMessages },
      es: { translation: spanishMessages },
    },
    supportedLngs: ["en", "es"],
    returnObjects: true,
  });
}
