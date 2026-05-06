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

/**
 * Expected contents of the `sentenceDates` property in the common namespace
 */
export const commonSentenceDatesResourceContentsSchema = z.object({
  general: z.object({
    heading: z.string(),
    dateReductionLabel: z.string(),
  }),
  dateFormats: z.object({
    dateFormatted: z.string(),
    dateDistanceFromToday: z.object({
      now: z.string(),
      past: z.string(),
      future: z.string(),
    }),
    missingDateMessage: z.string(),
    differenceInDays: z.string(),
  }),
});

/**
 * Translation resources for the common namespace are expected to conform
 * to this schema - it's not optional since any state could depend on these resources.
 */
export const commonSentenceDatesResourcesSchema = z.object({
  sentenceDates: commonSentenceDatesResourceContentsSchema,
});
/**
 * Sentence Dates resources for the common namespace
 */
export type CommonSentenceDatesResources = z.infer<
  typeof commonSentenceDatesResourcesSchema
>;

/**
 * Expected copy for any given date in a state resource bundle
 */
export const singleSentenceDateResourceSchema = z
  .object({
    label: z.string(),
    description: z.string().optional(),
    adjusted: z
      .object({
        originalDateLabel: z.string(),
        adjustedDateLabel: z.string(),
      })
      .optional(),
  })
  .strict();

/**
 * Resources that should appear only in the state namespaces. In real usage
 * these will be combined with other resources to produce the final shapes as seen below
 */
const stateOnlySentenceDatesResourcesSchema = z.object({
  dates: z.record(singleSentenceDateResourceSchema),
});

/**
 * Resources for states that support the Sentence Dates feature are expected
 * to conform to this schema. It may optionally contain overrides of any resources
 * from the common schema.
 */
export const stateSentenceDatesResourcesSchema = z.object({
  sentenceDates: stateOnlySentenceDatesResourcesSchema
    .merge(commonSentenceDatesResourcesSchema.shape.sentenceDates.deepPartial())
    .strict(),
});
/**
 * Sentence Dates resources for a state namespace. Note that this reflects what's in
 * the state's resource bundle but IS NOT the same as what can be selected at runtime.
 * See {@link CombinedSentenceDatesResources}
 */
export type StateSentenceDatesResources = z.infer<
  typeof stateSentenceDatesResourcesSchema
>;

/**
 * At runtime, i18next is configured to fall back to the common namespace
 * when a resource is missing from the state namespace. In practice this means that
 * the resources available for selection will be a merger of the state and common objects
 * (all optional overrides in the state resource will be backed by their required counterparts
 * in the common resource). The i18next type system doesn't infer this on its own, but
 * this schema represents the expected behavior.
 */
export const combinedSentenceDatesResourcesSchema = z.object({
  sentenceDates: stateOnlySentenceDatesResourcesSchema.merge(
    commonSentenceDatesResourcesSchema.shape.sentenceDates,
  ),
});
/**
 * The final, retrievable shape of a state's Sentence Dates resources at render time.
 * Not the same as {@link StateSentenceDatesResources}! See {@link combinedSentenceDatesResourcesSchema}
 * for more detail.
 */
export type CombinedSentenceDatesResources = z.infer<
  typeof combinedSentenceDatesResourcesSchema
>;
