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

/**
 * Converts a date string to a UTC Date object by appending 'Z' if not already present.
 * This ensures the date string is properly interpreted as UTC time.
 *
 * @param dateString - The date string to convert
 * @returns A Date object representing the UTC time
 */
export function toUTCDate(dateString: string | undefined | null): Date | null {
  if (!dateString) return null;

  // If the string already ends with 'Z', don't add another one
  const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  return new Date(utcString);
}
