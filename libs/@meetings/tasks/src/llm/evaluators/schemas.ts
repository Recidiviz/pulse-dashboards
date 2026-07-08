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

import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { z } from "zod";

import type { ActionItem } from "~@meetings/tasks/llm/schemas";

// Bump this string whenever any evaluator prompt changes.
// The script uses this to find pipeline runs that have not yet been evaluated
// at the current version.
export const EVALUATOR_VERSION = "1";

export const TranscriptComparisonOutputSchema = z.object({
  rationale: z.string(),
  winner: z.enum([
    "ASSEMBLYAI",
    "DEEPGRAM",
    "ABOUT_THE_SAME",
    "NONE",
    "SINGLE_PROVIDER",
  ]),
  assemblyAiGrade: z.enum(["GOOD", "PARTIAL", "BAD", "NONE"]),
  deepgramGrade: z.enum(["GOOD", "PARTIAL", "BAD", "NONE"]),
});

export const TextEvaluatorOutputSchema = z.object({
  // rationale precedes grade — forces reasoning before the label is committed
  rationale: z.string(),
  grade: z.enum(["GOOD", "PARTIAL", "BAD"]),
  hallucinations: z.array(z.string()),
  omissions: z.array(z.string()),
});

export const EvaluationScoresSchema = z.object({
  transcriptComparison: TranscriptComparisonOutputSchema.nullable(),
  caseNote: TextEvaluatorOutputSchema.nullable(),
  actionItems: TextEvaluatorOutputSchema.nullable(),
  overall: TextEvaluatorOutputSchema.nullable(),
});

export type TranscriptComparisonOutput = z.infer<
  typeof TranscriptComparisonOutputSchema
>;
export type TextEvaluatorOutput = z.infer<typeof TextEvaluatorOutputSchema>;
export type EvaluationScores = z.infer<typeof EvaluationScoresSchema>;

export interface MeetingContext {
  /** Full name of the client or resident. May not appear in the transcript. */
  personName?: string;
  /** Email address of the staff member conducting the meeting. */
  staffEmail?: string;
  /** Notes typed by the staff member during the meeting. */
  staffNotes?: string;
}

export interface EvaluatorInputs {
  /** GCS bucket containing the final merged audio file. */
  audioBucket: string;
  /** GCS path to the final merged audio file within the bucket. */
  audioPath: string;
  /** Per-provider transcript texts. Missing key means that provider did not run. */
  transcriptsByProvider: Partial<Record<"assemblyai" | "deepgram", string>>;
  /** Best transcript text (already selected by the pipeline) */
  bestTranscript: string;
  caseNote: string;
  actionItems: ActionItem[];
  /** Out-of-band facts about the meeting that may not appear in the transcript. */
  meetingContext?: MeetingContext;
}

export interface EvaluatorClients {
  gemini: GoogleGenerativeAI;
  fileManager: GoogleAIFileManager;
  /** Request timeout in milliseconds passed to each generateContentWithZodSchema call. */
  timeout?: number;
}
