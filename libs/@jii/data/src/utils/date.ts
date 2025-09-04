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

import { dateStringSchema } from "~datatypes";

const fullDateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function formatFullDate(date: Date) {
  return fullDateFormatter.format(date);
}

/**
 * Extracts any dates found in input text and reformats them
 * with {@link formatFullDate}. If none are found or if the date strings
 * turn out to be invalid or unparsable, returns the input string unaltered
 */
export function formatISODatesInText(text: string): string {
  try {
    return text.replaceAll(/\d{4}-\d{2}-\d{2}/g, (match) =>
      formatFullDate(dateStringSchema.parse(match)),
    );
  } catch {
    // fall through
  }

  return text;
}
