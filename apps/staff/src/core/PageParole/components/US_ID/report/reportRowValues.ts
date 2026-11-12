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

import { ResolvedRow } from "../../../../../ParoleStore/report/resolveSection";

/** A row's values, with null for a field that has no value. */
export type ReportRowValues<Fields> = {
  [Name in keyof Fields]: Fields[Name] | null;
};

/** Returns a resolved row's values, as the list shows them. */
export function rowValues<Fields>(
  row: ResolvedRow<Fields>,
): ReportRowValues<Fields> {
  const values = {} as ReportRowValues<Fields>;
  (Object.keys(row.fields) as Array<keyof Fields>).forEach((name) => {
    values[name] = row.fields[name].value;
  });
  return values;
}

/**
 * Returns a new row the PHI just saved, resolved the way resolveSection
 * resolves a row the PHI added: each saved field comes from the PHI, and
 * every other field is empty. The list shows it until the report listener
 * sends the saved row back, along with who saved it and when.
 *
 * @param id - The new row's PHI row id.
 * @param values - The new row's values, which name every field it has.
 * @param changes - The values that were saved.
 */
export function resolveSavedNewRow<Fields>(
  id: string,
  values: ReportRowValues<Fields>,
  changes: Partial<ReportRowValues<Fields>>,
): ResolvedRow<Fields> {
  const fields = {} as ResolvedRow<Fields>["fields"];
  (Object.keys(values) as Array<keyof Fields>).forEach((name) => {
    const saved = name in changes;
    fields[name] = {
      value: saved ? changes[name] ?? null : null,
      source: saved ? "PHI" : "ATLAS",
      atlasValue: null,
      editedBy: null,
      editedAt: null,
    };
  });
  return { id, status: "ADDED_BY_PHI", label: null, fields };
}

/** Returns values for a new row, with every field empty. */
export function blankRowValues<Fields>(
  fields: ReadonlyArray<keyof Fields>,
): ReportRowValues<Fields> {
  const values = {} as ReportRowValues<Fields>;
  fields.forEach((name) => {
    values[name] = null;
  });
  return values;
}

// Text saves without leading or trailing spaces, and text that's empty or
// only spaces saves as null, the same as a cleared field.
function normalize<Value>(value: Value | null | undefined): Value | null {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed === "" ? null : (trimmed as Value);
}

/**
 * Returns the values to save for a new row: every field the PHI filled in.
 * The list saves a new row only once this has a field, since nothing writes
 * an empty row.
 */
export function newRowChanges<Fields>(
  values: ReportRowValues<Fields>,
): Partial<ReportRowValues<Fields>> {
  const changes: Partial<ReportRowValues<Fields>> = {};
  (Object.keys(values) as Array<keyof Fields>).forEach((name) => {
    const value = normalize(values[name]);
    if (value !== null) changes[name] = value;
  });
  return changes;
}

/**
 * Returns the fields the PHI changed on a saved row, with null for a field
 * they cleared. Fields they left alone are left out, so saving keeps who
 * last edited them. Saved values are trimmed before comparing too, so an
 * Atlas value with stray spaces doesn't count as a change.
 */
export function editedRowChanges<Fields>(
  saved: ReportRowValues<Fields>,
  edited: ReportRowValues<Fields>,
): Partial<ReportRowValues<Fields>> {
  const changes: Partial<ReportRowValues<Fields>> = {};
  (Object.keys(edited) as Array<keyof Fields>).forEach((name) => {
    const value = normalize(edited[name]);
    if (value !== normalize(saved[name])) changes[name] = value;
  });
  return changes;
}

/**
 * Whether saving these changes would leave the row with at least one value.
 * The list doesn't let an edit clear every field, which would leave an
 * empty row.
 */
export function keepsAValue<Fields>(
  saved: ReportRowValues<Fields>,
  changes: Partial<ReportRowValues<Fields>>,
): boolean {
  const merged = { ...saved, ...changes };
  return Object.values(merged).some((value) => normalize(value) !== null);
}
