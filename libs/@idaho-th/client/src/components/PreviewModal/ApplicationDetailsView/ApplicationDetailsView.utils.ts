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

function formatMmDdYyyy(value: Date | "" | string | null | undefined) {
  if (!value) return undefined;
  if (value instanceof Date) {
    const formatted = format(value, "MM/dd/yyyy");
    return formatted || undefined;
  }
  if (typeof value === "string") return value;
  return undefined;
}

export function formatDobWithAge(
  dob: string | Date | "" | null | undefined,
  age: number | "" | null | undefined,
): string | undefined {
  const dobStr = formatMmDdYyyy(dob) ?? "";
  const ageStr = typeof age === "number" ? String(age) : "";

  if (dobStr && ageStr) return `${dobStr} (${ageStr})`;
  if (dobStr) return dobStr;
  if (ageStr) return ageStr;
  return undefined;
}

export function joinOrUndefined(
  values: readonly string[] | undefined | null,
): string | undefined {
  const list = normalizeStringList(values);
  return list.length > 0 ? list.join(", ") : undefined;
}

export function normalizeStringList(
  values: readonly string[] | string | undefined | null,
): string[] {
  let list: string[];
  if (values == null) {
    list = [];
  } else if (Array.isArray(values)) {
    list = [...values];
  } else if (typeof values === "string") {
    list = [values];
  } else {
    list = [];
  }
  return list.filter((s) => {
    const trimmed = s.trim();
    if (!trimmed) return false;
    const lowered = trimmed.toLowerCase();
    return lowered !== "null" && lowered !== "undefined";
  });
}
