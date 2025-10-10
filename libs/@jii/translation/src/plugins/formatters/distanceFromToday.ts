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

import { formatDistanceToNowStrict } from "date-fns";
import { enUS, es } from "date-fns/locale";

import { CachedFormatFunction } from "./types";

const locales = {
  en: enUS,
  "en-US": enUS,
  es: es,
  "es-ES": es,
} as const;

/**
 * Gets the date-fns locale for a language code, with fallback to English
 */
const getLocale = (lng?: string) => {
  if (!lng) return locales.en;
  return locales[lng as keyof typeof locales] || locales.en;
};

/**
 * Formatter that creates a distance from today string like "(2 months)"
 */
export const formatDistanceFromTodayFormatter: CachedFormatFunction = (
  lng,
  options: { fallbackText?: string },
) => {
  const fallbackText = options.fallbackText ?? "";

  // Get the appropriate locale or fall back to English
  const locale = getLocale(lng);

  return (value) => {
    if (!value) return fallbackText;

    // Use date-fns with proper locale support
    const distance = formatDistanceToNowStrict(value, { locale });

    return `${distance}`;
  };
};
