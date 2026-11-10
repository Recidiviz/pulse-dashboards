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

import { randomUUID } from "node:crypto";

/**
 * Single source of truth for generating opaque, random identifiers (UUIDv4).
 * Used for primary keys (e.g. application ids) and for PII-free GCS object ids.
 */
export function generateUuid(): string {
  return randomUUID();
}

export function formatIsoDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;

  const [, year, month, day] = match;
  return `${Number(month)}/${Number(day)}/${year}`;
}

export function parseDateString(value: unknown): Date | null {
  if (value == null) return null;

  const trimmed = String(value).trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(trimmed);
  const usMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);

  let year: number;
  let month: number;
  let day: number;
  if (isoMatch) {
    year = +isoMatch[1];
    month = +isoMatch[2];
    day = +isoMatch[3];
  } else if (usMatch) {
    month = +usMatch[1];
    day = +usMatch[2];
    year = +usMatch[3];
  } else {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  const isValidCalendarDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return isValidCalendarDate ? date : null;
}
