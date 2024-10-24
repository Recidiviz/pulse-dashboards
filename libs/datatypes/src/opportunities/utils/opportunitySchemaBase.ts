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

import { z } from "zod";

import { dateStringSchema } from "../../utils/zod/date/dateStringSchema";

const caseNoteSchema = z
  .object({
    noteTitle: z.string().nullable(),
    noteBody: z.string().nullable(),
    eventDate: dateStringSchema.nullable(),
  })
  .partial();

const baseCriteriaSchema = z.record(z.record(z.any()).nullable());

export const opportunitySchemaBase = z.object({
  stateCode: z.string(),
  externalId: z.string(),
  eligibleCriteria: baseCriteriaSchema,
  ineligibleCriteria: baseCriteriaSchema,
  caseNotes: z.record(z.array(caseNoteSchema)).default({}),
  // Identifier to support sentence-level opportunities, that is multiple instances of a
  // given opportunity for a given person
  opportunityId: z.string().optional(),
  // Hashed opportunity ID used to prevent emitting PII in Segment events
  opportunityPseudonymizedId: z.string().optional(),
});

export type OpportunityRecordBase = z.infer<typeof opportunitySchemaBase>;
