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

import { trim } from "lodash-es";
import { z } from "zod";

import { dateStringSchemaWithoutTimeShift } from "../../../../utils/zod";

// Case-plan goal/objective/technique values arrive wrapped in literal double
// quotes from the raw source (e.g. `"RS02A-Maintain Pro-Social Housing"`). Strip
// the wrapping quotes (and any surrounding whitespace) at parse time so every
// consumer gets clean text — mirrors the backend `TRIM(x, '" ')` used for the
// ORAS officer name in recidiviz-data #81828.
const quoteStrippedString = z.string().transform((value) => trim(value, '" '));

export const usMoClientMetadataSchema = z.object({
  stateCode: z.literal("US_MO"),
  // Parsed to a Date so downstream consumers don't have to re-`parseISO` on
  // every render. We use the no-time-shift variant — `dateStringSchema`'s
  // demo/offline fixture shift would alter the apparent age. Matches the
  // pattern in `libs/datatypes/src/metrics/ClientInfo/schema.ts`.
  birthdate: dateStringSchemaWithoutTimeShift,
  sex: z.string(), // raw — capitalize at display time
  latestCycleSentences: z.array(
    z.object({
      classificationSubtype: z.string(), // e.g. "D"
      classificationType: z.string(), // e.g. "Felony"
      description: z.string(),
      statute: z.string().nullish(),
    }),
  ),
  // ORAS risk/needs assessment. Optional because only ~60% of records have one;
  // inner fields are nullish to mirror the backend nullish columns. Parsed
  // assessmentDate to a Date for the same reason as `birthdate` above.
  orasAssessment: z
    .object({
      assessmentDate: dateStringSchemaWithoutTimeShift.nullish(),
      assessmentType: z.string().nullish(),
      assessmentScore: z.number().nullish(),
      assessmentAdministeredBy: z.string().nullish(),
      lastUpdated: dateStringSchemaWithoutTimeShift.nullish(),
    })
    .nullish(),
  // Case plan goals with their objectives/techniques. Optional because only ~2%
  // of records have one; inner fields are nullish to mirror the backend.
  casePlan: z
    .array(
      z.object({
        goal: quoteStrippedString.nullish(),
        objectivesAndTechniques: z.array(
          z.object({
            objective: quoteStrippedString.nullish(),
            objectiveEndDate: dateStringSchemaWithoutTimeShift.nullish(),
            techniques: z.array(quoteStrippedString),
          }),
        ),
      }),
    )
    .optional(),
});
export type UsMoClientMetadata = z.infer<typeof usMoClientMetadataSchema>;
