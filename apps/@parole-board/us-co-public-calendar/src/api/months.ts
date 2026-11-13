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

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

// The years the public read accepts. Any other year is a bad request.
const MIN_YEAR = 2000;
const MAX_YEAR = 5000;

/**
 * Whether value is a month the public read accepts, such as "2026-11": a
 * "YYYY-MM" month in a year from 2000 to 5000.
 */
export function isMonthParam(value: string): boolean {
  if (!MONTH_PATTERN.test(value)) return false;
  const year = Number(value.slice(0, 4));
  return year >= MIN_YEAR && year <= MAX_YEAR;
}
