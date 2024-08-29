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

export const caseNotesSchema = z.object({
  caseNotes: z.record(z.array(caseNoteSchema)).default({}),
});

export const caseNoteSearchSchema = z.object({
  error: z.string().nullable(),
  results: z.array(
    z
      .object({
        note_title: z.string().nullable(),
        case_note: z.string().nullable(),
        date: z.string(),
        document_id: z.string(),
        contact_mode: z.string().nullable(),
        extractive_answer: z.string().nullable(),
        note_type: z.string().nullable(),
        preview: z.string(),
        snippet: z.string().nullable(),
      })
      .transform((data) => {
        return {
          noteTitle: data.note_title,
          noteBody: data.case_note,
          eventDate: data.date,
          documentId: data.document_id,
          contactMode: data.contact_mode,
          extractiveAnswer: data.extractive_answer,
          noteType: data.note_type,
          preview: data.preview,
          snippet: data.snippet,
        };
      }),
  ),
});

export type CaseNoteSearchResults = z.infer<
  typeof caseNoteSearchSchema
>["results"];
export type CaseNoteSearchRecord = z.infer<typeof caseNoteSearchSchema>;
export type CaseNoteSearchRecordRaw = z.infer<typeof caseNoteSearchSchema>;
