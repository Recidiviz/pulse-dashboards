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

import {
  ActionItemSchema,
  CriticalUpdateSchema,
  MinuteSectionSchema,
} from "~@meetings/tasks";

export const getDetailInputSchema = z.object({
  meetingId: z.string(),
});

// Output schema for parsed meeting details
export const getDetailsOutputSchema = z.object({
  id: z.string(),
  startTime: z.date(),
  endTime: z.date().nullable(),
  caseNote: z.string().nullable(),
  userNotepadNotes: z.string().nullable(),
  actionItems: z.array(ActionItemSchema).nullable(),
  criticalUpdates: z.array(CriticalUpdateSchema).nullable(),
  meetingSummary: z.array(MinuteSectionSchema).nullable(),
  postMeetingProcessingStatus: z.string(),
  transcription: z
    .object({
      confidence: z.number().nullable(),
      summary: z.string().nullable(),
      utterances: z.array(
        z.object({
          confidence: z.number().nullable(),
          text: z.string(),
          speaker: z.string().nullable(),
          startTimeMs: z.number(),
          endTimeMs: z.number(),
        }),
      ),
    })
    .nullable()
    .optional(),
});

export type GetDetailsOutput = z.infer<typeof getDetailsOutputSchema>;

export const getSignedUrlForRecordingInputSchema = z.object({
  meetingId: z.string(),
  platform: z.enum(["web", "ios", "android"]).optional(),
});

export const discardMeetingInputSchema = z.object({
  meetingId: z.string(),
});

export const endMeetingInputSchema = z.object({
  meetingId: z.string(),
  userNotepadNotes: z.string().max(100000).optional(),
  actionItems: z.string().max(100000).optional(),
  criticalUpdates: z.string().max(100000).optional(),
  meetingSummary: z.string().max(100000).optional(),
});

export const updateNotesInputSchema = z.object({
  meetingId: z.string(),
  userNotepadNotes: z.string().max(100000).optional(),
  actionItems: z.string().max(100000).optional(),
  criticalUpdates: z.string().max(100000).optional(),
  meetingSummary: z.string().max(100000).optional(),
});
