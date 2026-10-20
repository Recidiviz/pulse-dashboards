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

import { z } from "zod";

import { DOCUMENT_SYSTEMS, documentSystemSchema } from "~@typesense/client";

// `US_` followed by two or three uppercase letters (US_AZ, US_ID, US_NYC). Not
// every tenant is a state: a city tenant carries three letters, so a two-letter
// pattern rejects it and the ETL's trigger 400s for that whole tenant.
const STATE_CODE_PATTERN = /^US_[A-Z]{2,3}$/;

/**
 * Mirrors `nullishAsUndefined` in ~datatypes/utils/zod.
 *
 * Copied rather than imported: that helper is not on the ~datatypes barrel, and
 * importing a VALUE from it would bundle every opportunity schema into this
 * function.
 */
function nullishAsUndefined<T extends z.ZodTypeAny>(schema: T) {
  return schema
    .nullish()
    .transform((output) => (output === null ? undefined : output));
}

/**
 * One backfill request.
 *
 * Every field is optional on its own: the ETL's per-source trigger sends all
 * four, and a manual whole-collection run sends none.
 */
export const backfillRequestSchema = z
  .object({
    // Dropping the filter widens the run to every collection, and the prune
    // then deletes whatever is out of scope, so a malformed filter must never
    // degrade to "backfill everything".
    collections: nullishAsUndefined(
      z
        .array(z.string().min(1), {
          invalid_type_error: "collections must be an array of strings",
        })
        .nonempty("collections must not be empty"),
    ),
    stateCode: nullishAsUndefined(
      z
        .string()

        .regex(STATE_CODE_PATTERN, "stateCode must look like US_XX or US_XXX"),
    ),
    sourceCollection: nullishAsUndefined(
      z.string().min(1, "sourceCollection must not be blank"),
    ),
    system: nullishAsUndefined(documentSystemSchema),
  })
  .superRefine((body, ctx) => {
    if (body.sourceCollection && !body.system) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["system"],
        message: `system is required alongside sourceCollection; expected one of ${DOCUMENT_SYSTEMS.join(", ")}`,
      });
    }
  });

export type BackfillRequest = z.infer<typeof backfillRequestSchema>;

/**
 * One line per failing field, named, because the caller is an automated ETL
 * trigger that cannot inspect a nested issue tree.
 */
export function parseBackfillRequest(
  body: unknown,
): { request: BackfillRequest } | { error: string } {
  // A GET, or a POST with no body, is a whole-collection run.
  const result = backfillRequestSchema.safeParse(body ?? {});
  if (result.success) return { request: result.data };

  return {
    error: result.error.issues
      .map((i) =>
        i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message,
      )
      .join("; "),
  };
}
