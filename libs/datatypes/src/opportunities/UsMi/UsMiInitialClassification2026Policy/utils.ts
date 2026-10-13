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

import { dateStringSchema } from "../../../utils/zod";

export const incidentNotesSchema = z
  .object({
    incidentsList: z.array(
      z.object({
        incarcerationIncidentId: z.coerce.number(),
        incidentClass: z.string(),
        incidentDate: dateStringSchema,
        incidentTimePeriod: z.string(),
        infractionTypeRawText: z.string(),
      }),
    ),
    latestIncidentDate: dateStringSchema,
  })
  .partial()
  .passthrough();

export const usMiClassificationFormBaseSchema = z
  .object({
    ageNotes: z
      .object({
        age: z.coerce.number(),
      })
      .passthrough()
      .nullable(),
    vfoNotes: z
      .object({
        assessmentDate: dateStringSchema,
        vfoLevelDetail: z.string(),
        vfoLevel: z.string(),
      })
      .passthrough()
      .nullable(),
    currentViolentIncNotes: incidentNotesSchema.nullable(),
    pastViolentIncNotes: incidentNotesSchema.nullable(),
    currentFightThreatPowIncNotes: incidentNotesSchema.nullable(),
    pastFightThreatPowIncNotes: incidentNotesSchema.nullable(),
    currentOtherIncNotes: incidentNotesSchema.nullable(),
    felonyConvictionNotes: z
      .array(
        z.object({
          description: z.string(),
          imposedDate: dateStringSchema,
          statute: z.string(),
        }),
      )
      .nullable(),
    pastAdSegNotes: z
      .object({
        numAdSegStartsInPast36Months: z.coerce.number(),
        adSegStartsList: z.array(z.record(z.unknown())).nullable(),
      })
      .passthrough()
      .nullable(),
    ageScore: z.coerce.number().nullable(),
    calculatedTotalScore: z.coerce.number().nullable(),
    currentFightThreatPowIncScore: z.coerce.number().nullable(),
    currentOtherIncScore: z.coerce.number().nullable(),
    currentViolentIncScore: z.coerce.number().nullable(),
    pastAdSegScore: z.coerce.number().nullable(),
    pastFightThreatPowIncScore: z.coerce.number().nullable(),
    pastViolentIncScore: z.coerce.number().nullable(),
    vfoScore: z.coerce.number().nullable(),
  })
  .partial()
  .passthrough();
