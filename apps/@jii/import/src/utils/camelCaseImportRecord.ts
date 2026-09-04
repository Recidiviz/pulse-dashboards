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

import camelcase from "camelcase";

/*
 * This is a faster stand-in for camelCaseObject in ~utils, which uses camelcase-keys and shows
 * up as a meaningful share of this job's CPU time because it runs on every field of every row.
 * It lives here rather than in ~utils because it is only equivalent under assumptions that hold
 * for a raw platform export and can't be promised repo-wide:
 *
 *   - input is the output of JSON.parse, so it contains no cycles (there is no cycle detection
 *     here, unlike camelcase-keys, and a cyclic input would trigger an infinite recursion)
 *   - keys are drawn from a fixed set of export columns, so we know the cache will be finite
 *   - nothing relies on camelcase-keys' key exclusion feature
 *   - an own `__proto__` key can only be renamed to something harmless by the conversion, which
 *     camelCaseImportRecord.test.ts pins, since nothing here guards against it
 *
 * Per-key conversion is still delegated to the camelcase package, which is what camelcase-keys
 * uses internally, so casing behavior is unchanged. Only the traversal is custom.
 */

/**
 * Raw key -> camelCase key. Collapses to a single Map lookup per key after the first record,
 * which is what makes this cheap across tens of thousands of rows.
 */
const keyCache = new Map<string, string>();

function toCamelCase(key: string): string {
  const cached = keyCache.get(key);
  if (cached !== undefined) return cached;

  const converted = camelcase(key);
  keyCache.set(key, converted);
  return converted;
}

/**
 * Keys are only rewritten on plain objects; anything else with a prototype (a Date, a class
 * instance) is passed through untouched rather than being rebuilt as a bare object.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function convertDeeply(value: unknown): unknown {
  if (Array.isArray(value)) {
    const converted = new Array(value.length);
    for (let i = 0; i < value.length; i++) {
      converted[i] = convertDeeply(value[i]);
    }
    return converted;
  }

  if (isPlainObject(value)) {
    const converted: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      converted[toCamelCase(key)] = convertDeeply(value[key]);
    }
    return converted;
  }

  return value;
}

/**
 * Given a record from a raw platform export, returns a version with all keys (including nested
 * keys) converted to camelCase.
 */
export function camelCaseImportRecord(input: Record<string, unknown>) {
  return convertDeeply(input) as Record<string, unknown>;
}
