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

import { isDate } from "lodash";
import mapObject from "map-obj";

import { shiftFixtureDate } from "./fixtureDates";

export function shiftAllDates<T extends Record<string, unknown>>(target: T): T {
  return <T>mapObject(
    target,
    (sourceKey, sourceValue) => {
      if (isDate(sourceValue)) {
        return [
          // TS seems to lose track of the key type inside this function
          sourceKey as string,
          // TS seems confused by narrowing this value type to a Date,
          // but since we're under a typeguard we know it's assignable to the value type
          shiftFixtureDate(sourceValue) as typeof sourceValue,
        ];
      }
      // TS seems to lose track of the key type inside this function
      return [sourceKey as string, sourceValue];
    },
    { deep: true },
  );
}
