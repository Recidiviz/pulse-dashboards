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

import {
  ApprovalValue,
  FeedbackVoteValue,
  NoteSection,
  PostMeetingProcessingStatus,
} from "~@meetings/prisma/client";
import {
  MinuteSectionSchema,
  StaffFeedbackOutputSchema,
  ValidationError,
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
  actionItems: z.array(z.string()).nullable(),
  structuredActionItems: z
    .array(
      z.object({
        task: z.string(),
        context: z.string().nullable(),
        evidenceQuotes: z.array(z.string()).nullable().optional(),
      }),
    )
    .nullable(),
  criticalUpdates: z.array(z.string()).nullable(),
  meetingSummary: z.array(MinuteSectionSchema).nullable(),
  staffFeedback: StaffFeedbackOutputSchema.extend({
    generatedAt: z.date(),
  }).nullable(),
  currentFeedbackVote: z.nativeEnum(FeedbackVoteValue).nullable(),
  // Most-recent user edit per section; null = untouched LLM output.
  caseNoteEditedAt: z.date().nullable(),
  actionItemsEditedAt: z.date().nullable(),
  // Creator approval per section, tied to the active notetakingPipelineRunId.
  approvals: z.object({
    caseNote: z.boolean(),
    actionItems: z.boolean(),
  }),
  durationMs: z.number().nullable(),
  postMeetingProcessingStatus: z.nativeEnum(PostMeetingProcessingStatus),
  transcriptDeletedAt: z.date().nullable(),
  validationErrorType: z.nativeEnum(ValidationError).nullable(),
  staffEmail: z.string(),
  meetingType: z.string().nullable(),
  meetingTypeCategory: z.string().nullable(),
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
  audioUrl: z.string().nullable(),
});

export type GetDetailsOutput = z.infer<typeof getDetailsOutputSchema>;

export const createSignedUrlForRecordingInputSchema = z.object({
  meetingId: z.string(),
  fileExtension: z.string(),
  contentType: z.string(),
});

export const deleteRecordingsInputSchema = z.object({
  meetingId: z.string(),
});

export const discardMeetingInputSchema = z.object({
  meetingId: z.string(),
});

export const endMeetingInputSchema = z.object({
  meetingId: z.string(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  userNotepadNotes: z.string().max(100000).optional(),
});

export const updateNotesInputSchema = z.object({
  meetingId: z.string(),
  userNotepadNotes: z.string().max(100000).optional(),
  actionItems: z.array(z.string().max(100000)).optional(),
  criticalUpdates: z.array(z.string().max(100000)).optional(),
  caseNote: z.string().max(100000).optional(),
});

export const voteFeedbackInputSchema = z.object({
  meetingId: z.string(),
  vote: z.nativeEnum(FeedbackVoteValue),
});

export const approveSectionInputSchema = z.object({
  meetingId: z.string(),
  section: z.nativeEnum(NoteSection),
  value: z.nativeEnum(ApprovalValue),
});
