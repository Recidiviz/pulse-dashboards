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

export type ShiftedDateRecord = { path: Array<string | number>; value: Date };

/**
 * this is global because we can't pass it directly into Zod, it needs to be an ambient variable.
 * the tradeoff is that we have to manage its state and never use it concurrently. Initialized as undefined
 * so that it's off by default (and gets turned off between explicit calls to {@link collectShiftedDates}).
 */
let collector: Array<ShiftedDateRecord> | undefined;

/**
 * Stores information about a shifted date in a global collector for other consumers to access.
 * Lets us extract additional information from a Zod parse as a side effect.
 * @param path path to the shifted date
 * @param value the value it was shifted to
 */
export function recordShiftedDate(path: Array<string | number>, value: Date) {
  // the ?. makes this a no-op  if the collector is not defined.
  // which it should not be, unless called within a collectShiftedDates closure
  collector?.push({
    // snapshot the path rather than storing the caller's array by reference, to guard against
    // repeated calls with a mutated path array rather than a freshly created array
    path: [...path],
    value,
  });
}

/**
 * Takes over the global collector array to store any dates that are shifted by calling `fn`.
 * Restores the previous value when it's complete to support nested calls.
 * @param fn must be a synchronous function; the collector is restored as soon as it returns,
 * so an async function would record only its synchronous portion and silently discard the rest.
 */
export function collectShiftedDates<T>(
  fn: () => T extends PromiseLike<unknown> ? never : T,
) {
  const previous = collector;
  const shiftedDates: Array<ShiftedDateRecord> = [];
  collector = shiftedDates;
  try {
    return { result: fn(), shiftedDates };
  } finally {
    collector = previous;
  }
}
