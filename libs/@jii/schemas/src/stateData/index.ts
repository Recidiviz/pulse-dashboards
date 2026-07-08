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

import { ValuesType } from "utility-types";

import { usArStateDataSchema } from "./US_AR";
import { usAzStateDataSchema } from "./US_AZ";
import { usCoStateDataSchema } from "./US_CO";
import { usMaStateDataSchema } from "./US_MA";
import { usNcStateDataSchema } from "./US_NC";
import { usNdStateDataSchema } from "./US_ND";
import { usNeStateDataSchema } from "./US_NE";
import { usTnStateDataSchema } from "./US_TN";

export const stateDataSchemas = {
  US_AR: usArStateDataSchema,
  US_AZ: usAzStateDataSchema,
  US_CO: usCoStateDataSchema,
  US_MA: usMaStateDataSchema,
  US_NC: usNcStateDataSchema,
  US_ND: usNdStateDataSchema,
  US_NE: usNeStateDataSchema,
  US_TN: usTnStateDataSchema,
};

/**
 * Convenience method for looking up state schemas that may not exist.
 * Takes any string as the `stateCode` input so beware of typos and other
 * such miscues when calling it!
 */
export function findStateSchema(
  stateCode: string,
): ValuesType<typeof stateDataSchemas> | undefined {
  // because we are indexing with an unknown string, the result could be undefined
  return stateDataSchemas[stateCode as keyof typeof stateDataSchemas];
}
