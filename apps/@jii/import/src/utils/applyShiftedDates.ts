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

import { formatISO } from "date-fns";
import { cloneDeep, get, set } from "lodash-es";

import { ShiftedDateRecord } from "~datatypes";

export function applyShiftedDates<T extends Record<string, unknown>>(
  obj: T,
  shiftedDates: Array<ShiftedDateRecord>,
): T {
  // deep clone to avoid mutating the input (assumed to be our actual fixture objects)
  const shiftedObj = cloneDeep(obj);
  shiftedDates.forEach(({ path, value }) => {
    // we have to make sure the specified path actually exists in the input object;
    // a schema with a preprocess step could violate this assumption, in which case we would
    // not know where to write the shifted data. Throw this as a fatal error, not just a row-level parse failure
    const existing = get(shiftedObj, path);
    if (typeof existing !== "string") {
      throw new Error(
        `Cannot apply shifted date at "${path.join(".")}": expected a date string in the source data but found ${
          existing === undefined ? "nothing" : typeof existing
        }`,
      );
    }

    // stores the shifted date as a string so it can be parsed by dateStringSchema at read time
    set(shiftedObj, path, formatISO(value, { representation: "date" }));
  });

  return shiftedObj;
}
