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
  OutputVoteTab,
  OutputVoteValue,
  StateCode,
} from "~@meetings/prisma/client";
import type { DecodedField } from "~@meetings/tasks/admin/label-studio-annotations";
import type {
  GradedDimensionKey,
  GradesByDimension,
  HumanGrade,
} from "~@meetings/tasks/admin/label-studio-grades";
import type { LlmajDimension } from "~@meetings/tasks/admin/llmaj-grades";

/** Hard ceiling on how far back the meeting-date window reaches, and its default. */
export const MAX_LOOKBACK_DAYS = 365;

// US_DEMO is Recidiviz's own demo/test data, not a real agency, so it is
// excluded from the flagged list unless asked for by name.
export const EXCLUDED_BY_DEFAULT: ReadonlySet<string> = new Set([
  StateCode.US_DEMO,
]);

/** The parts of a meeting a flag can point at; a flag always lands on exactly one. */
export const FLAG_SECTIONS = ["CASE_NOTE", "ACTION_ITEMS", "OVERALL"] as const;
export type FlagSection = (typeof FLAG_SECTIONS)[number];

/** Who flagged a section. */
export interface SectionFlag {
  llm: boolean;
  labelStudio: boolean;
  vote: boolean;
}

export type SectionFlags = Record<FlagSection, SectionFlag>;

export const listFlaggedMeetingsInput = z.object({
  /** Meeting-date window, counted back from now and matched against Meeting.startTime. */
  lookbackDays: z.number().int().min(1).max(MAX_LOOKBACK_DAYS).optional(),
  /** Defaults to every state the caller is allowed to see, minus US_DEMO. */
  stateCodes: z.array(z.nativeEnum(StateCode)).nonempty().optional(),
  /** Case-insensitive match on the meeting id or the staff member's email. */
  search: z.string().trim().min(1).optional(),
});

export type ListFlaggedMeetingsInput = z.infer<typeof listFlaggedMeetingsInput>;

export const flaggedMeetingDetailsInput = z.object({
  stateCode: z.nativeEnum(StateCode),
  meetingId: z.string(),
});

// =============================================================================
// List
// =============================================================================

export type SourceName =
  | "database"
  | "evaluations"
  | "labelStudio"
  | "inAppFeedback";

export interface SourceStatus {
  name: SourceName;
  /** "not_configured" is an environment without Label Studio, not a failure. */
  status: "ok" | "failed" | "not_configured";
  /** A short summary of the failure. The full error goes to Sentry. */
  error?: string;
}

export type ReviewGrade = "GOOD" | "PARTIAL" | "BAD";

export type LabelStudioSummary =
  | { status: "not_sent" }
  | { status: "not_rated"; taskId: number }
  | {
      status: "rated";
      taskId: number;
      raterCount: number;
      combined: GradesByDimension;
    };

export interface FlaggedMeetingSummary {
  meetingId: string;
  stateCode: StateCode;
  startTime: Date;
  staffEmail: string;
  llm: {
    evaluatorVersion: string;
    createdAt: Date;
    grades: Partial<
      Record<"caseNote" | "actionItems" | "overall", ReviewGrade>
    >;
  } | null;
  /** Null when this environment has no Label Studio. */
  labelStudio: LabelStudioSummary | null;
  /** The staff thumbs up and down that apply to the meeting's current outputs. */
  votes: { tab: OutputVoteTab; vote: OutputVoteValue }[];
  sections: SectionFlags;
}

export interface ListFlaggedMeetingsResult {
  sources: SourceStatus[];
  /** Empty whenever any source failed, since a partial list would hide flagged meetings. */
  meetings: FlaggedMeetingSummary[];
}

// =============================================================================
// Details
// =============================================================================

export interface CombinedGrade {
  grade: HumanGrade | null;
  /** The worst grade any rater gave, which differs from `grade` when the authoritative rater overrode it. */
  worst: HumanGrade | null;
  overriddenByAuthoritative: boolean;
}

export interface LabelStudioRaterDetail {
  raterEmail: string;
  annotatedAt: Date;
  updatedAt: Date;
  isAuthoritative: boolean;
  grades: GradesByDimension;
  /** The rater's grade on transcript quality, which never flags a meeting. */
  transcriptGrade: HumanGrade | null;
  /** Every decoded field, notes included. */
  fields: DecodedField[];
  actionItemsIgnoredFieldName: string | null;
}

export interface LabelStudioDetail {
  taskId: number;
  taskUrl: string;
  raters: LabelStudioRaterDetail[];
  combined: Record<GradedDimensionKey, CombinedGrade>;
}

export interface OutputVoteDetail {
  voterEmail: string;
  vote: OutputVoteValue;
  tab: OutputVoteTab;
  message: string | null;
  createdAt: Date;
}

export interface MeetingActionItemDetail {
  assignee: string;
  generatedTask: string;
  editedTask: string | null;
  context: string | null;
  completed: boolean;
  deleted: boolean;
  /** Staff added this item themselves; the pipeline did not generate it. */
  addedByStaff: boolean;
}

export interface TranscriptUtterance {
  speaker: string;
  text: string;
  startTimeMs: number;
}

export interface FlaggedMeetingDetails {
  meetingId: string;
  stateCode: StateCode;
  staffEmail: string;
  person: {
    type: "client" | "resident" | null;
    name: string | null;
    displayId: string | null;
  };
  meetingType: string | null;
  startTime: Date;
  durationMs: number | null;
  audioDeletedAt: Date | null;
  transcriptDeletedAt: Date | null;
  audioConsoleUrl: string | null;
  llm: {
    evaluatorVersion: string;
    createdAt: Date;
    dimensions: LlmajDimension[];
  } | null;
  /** Null when the meeting has no Label Studio task, or this environment has no Label Studio. */
  labelStudio: LabelStudioDetail | null;
  votes: OutputVoteDetail[];
  sections: SectionFlags;
  caseNote: {
    current: string | null;
    /** The pre-edit generated case note, for diffing against `current`. Null when there is nothing to diff. */
    original: string | null;
    editedAt: Date | null;
    approvedAt: Date | null;
  };
  actionItems: {
    items: MeetingActionItemDetail[];
    /** Meetings from before action items moved to their own rows keep them as text. */
    legacyItems: string[];
    editedAt: Date | null;
    approvedAt: Date | null;
  };
  userNotepadNotes: string | null;
  /** The best transcript, or null once it has been deleted. */
  transcript: TranscriptUtterance[] | null;
}
