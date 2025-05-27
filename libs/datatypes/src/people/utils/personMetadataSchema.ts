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

import { z } from "zod";

// z.enum() reqires this constraint
type AtLeastOne<T> = [T, ...T[]];

function isAtLeastOne<T>(arr: T[]): arr is AtLeastOne<T> {
  return arr.length > 0;
}

// prettier-ignore
const allStateCodes = [
  "US_AL", "US_AK", "US_AZ", "US_AR", "US_CA",
  "US_CO", "US_CT", "US_DE", "US_FL", "US_GA",
  "US_HI", "US_ID", "US_IL", "US_IN", "US_IA",
  "US_KS", "US_KY", "US_LA", "US_ME", "US_MD",
  "US_MA", "US_MI", "US_MN", "US_MS", "US_MO",
  "US_MT", "US_NE", "US_NV", "US_NH", "US_NJ",
  "US_NM", "US_NY", "US_NC", "US_ND", "US_OH",
  "US_OK", "US_OR", "US_PA", "US_RI", "US_SC",
  "US_SD", "US_TN", "US_TX", "US_UT", "US_VT",
  "US_VA", "US_WA", "US_WV", "US_WI", "US_WY",
] as const;

type StateCode = (typeof allStateCodes)[number];

type StateMetadataSchema = z.ZodObject<{
  stateCode: z.ZodLiteral<StateCode>;
}>;

/*
 * States can define their own schemas for the client/resident metadata field.
 * After parsing the person record, we want to know that if metadata.stateCode matches
 * one of the defined schemas, then the rest of the metadata object follows that schema.
 * If the stateCode is not one of the defined schemas, then we want to pass through
 * the raw object. This means that states with defined schemas have useful types, while
 * states without can still read the metadata field, just without type safety. An example
 * of the latter case would be criteria copy accessing `{{opportunity.person.metadata.foo}}`.
 *
 * Concretely, we'll be returning a discriminated union of the defined schemas plus a
 * passthrough object where the stateCode can be any state without a defined schema.
 */
export function personMetadataSchema<
  DefinedStateMetadataSchemas extends AtLeastOne<StateMetadataSchema>,
>(stateMetadataSchemas: DefinedStateMetadataSchemas) {
  /*
   * For type narrowing to work right on the defined schemas, the fallback schema's stateCode
   * has to exclude the defined states. First we'll define that in type-land:
   */
  type NoSchemaStateCode = Exclude<
    StateCode,
    DefinedStateMetadataSchemas[number]["shape"]["stateCode"]["value"]
  >;

  // Then we'll define a type guard for the type:
  const schemaStateCodes = stateMetadataSchemas.map(
    (s) => s.shape.stateCode.value,
  );
  function isNoSchemaStateCode(code: StateCode): code is NoSchemaStateCode {
    return !schemaStateCodes.includes(code);
  }

  // And use the guard to build a tightly-typed array of state codes that have no schema:
  const noSchemaStateCodes = allStateCodes.filter(isNoSchemaStateCode);

  const allSchemas = (
    isAtLeastOne(noSchemaStateCodes) // If there are no states without schemas, we don't need to add the passthrough schema (and zod hates an empty enum)
      ? [
          ...stateMetadataSchemas,
          z
            .object({
              stateCode: z.enum(noSchemaStateCodes).optional(),
            })
            .passthrough(),
        ]
      : stateMetadataSchemas
  ) satisfies AtLeastOne<z.ZodDiscriminatedUnionOption<"stateCode">>;

  return z.discriminatedUnion("stateCode", allSchemas).optional();
}
