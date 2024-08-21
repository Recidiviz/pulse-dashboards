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

import { TRANSLATIONS } from "../RootStore/TenantStore/lanternTenants";

export const i18n = i18next;

export function initI18n() {
  i18next.init({
    resources: {
      US_MO: { lantern: TRANSLATIONS.US_MO },
      US_PA: { lantern: TRANSLATIONS.US_PA },
    },
    ns: "lantern",
    lng: "US_PA",
    supportedLngs: ["US_PA", "US_MO"],
    returnObjects: true,
  });
}

export function setTranslateLocale(tenant) {
  return i18next.changeLanguage(tenant);
}

export function translate(term) {
  return i18next.t(term);
}
