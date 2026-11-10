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

import { format } from "date-fns";

import { normalizeStringList } from "../ApplicationDetailsView.utils";

const EMPTY = "—";

type DisplayValue = string | number | boolean | Date | null | undefined;

export function displayValue(value: DisplayValue): string {
  if (value == null || value === "") return EMPTY;
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value instanceof Date) {
    try {
      return format(value, "MM/dd/yyyy");
    } catch {
      return EMPTY;
    }
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return EMPTY;
    const lowered = trimmed.toLowerCase();
    if (lowered === "null" || lowered === "undefined") return EMPTY;
    return trimmed;
  }
  return String(value);
}

export function displayList(
  values: readonly string[] | string | undefined | null,
): string {
  const filtered = normalizeStringList(values);
  if (filtered.length === 0) return EMPTY;
  return filtered.join(", ");
}
