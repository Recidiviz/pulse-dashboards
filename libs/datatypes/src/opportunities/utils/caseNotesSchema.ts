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

import { dateStringSchema } from "../../utils/dateStringSchema";

const caseNoteSchema = z
  .object({
    noteTitle: z.string().nullable(),
    noteBody: z.string().nullable(),
    eventDate: dateStringSchema.nullable(),
  })
  .partial();

export const caseNotesSchema = z.object({
  caseNotes: z.record(z.array(caseNoteSchema)).default({}),
});

export const caseNoteSearchSchema = z.object({
  error: z.string().nullable(),
  results: z.array(
    caseNoteSchema.extend({
      documentId: z.string(),
      contactMode: z.string(),
      extractiveAnswer: z.string(),
      noteType: z.string(),
      preview: z.string(),
      snippet: z.string().nullable(),
    }),
  ),
});

export type CaseNoteSearchResults = z.input<
  typeof caseNoteSearchSchema
>["results"];
export type CaseNoteSearchRecord = z.infer<typeof caseNoteSearchSchema>;
export type CaseNoteSearchRecordRaw = z.input<typeof caseNoteSearchSchema>;
