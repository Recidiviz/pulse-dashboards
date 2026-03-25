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

import { I18nextProvider } from "react-i18next";

import { createI18nInstance } from "~@jii/translation";

// An i18next instance with only access to English-language JII translations
const jiiI18nInstance = createI18nInstance([]);

/**
 * Provides an i18next instance to its children;
 * use hooks from the @jii/translation library to access translations
 */
export const RNAI18nProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <I18nextProvider i18n={jiiI18nInstance}>{children}</I18nextProvider>;
};
