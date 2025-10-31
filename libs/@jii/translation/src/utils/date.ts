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

import { enUS, es } from "date-fns/locale";

export const fullDateFormatOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

const dateFnsLocales = {
  en: enUS,
  "en-US": enUS,
  es: es,
  "es-ES": es,
} as const;

/**
 * Gets the date-fns locale for a language code, with fallback to English
 */
export const getDateFnsLocale = (lng?: string) => {
  if (!lng) return dateFnsLocales.en;
  return (
    dateFnsLocales[lng as keyof typeof dateFnsLocales] || dateFnsLocales.en
  );
};

export const daysTemplate = {
  singular: "{{count, number}} day",
  plural: "{{count, number}} days",
};
