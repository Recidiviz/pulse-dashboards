// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { Dictionary, mapKeys, toUpper } from "lodash";
import { z } from "zod";

export function uppercaseSchemaKeys<Schema extends z.ZodTypeAny>(
  schema: Schema,
) {
  return z.preprocess(
    // we expect the backend to have transformed all keys into camel case;
    // uppercasing them should make them conform to the status enum
    (input) => mapKeys(input as Dictionary<unknown>, (v, k) => toUpper(k)),
    schema,
  );
}
