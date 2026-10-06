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

import type {
  EvaluationScores,
  TextEvaluatorOutput,
  TranscriptComparisonOutput,
} from "~@meetings/tasks/llm/evaluators/schemas";

// =============================================================================
// Reading LLMAJ evaluation scores as a flat, gradeable list of dimensions.
//
// Pure functions only. The mirror of label-studio-grades.ts on the machine
// side: same "which dimensions can flag a meeting" question, different source.
// =============================================================================

export type LlmajDimensionKey =
  | "transcriptComparison"
  | "caseNote"
  | "actionItems"
  | "overall";

export const LLMAJ_DIMENSION_LABELS: Record<LlmajDimensionKey, string> = {
  transcriptComparison: "Transcript",
  caseNote: "Case Note",
  actionItems: "Action Items",
  overall: "Overall",
};

// The dimensions whose BAD grade flags a meeting. The judge's overall grade is
// included because it sometimes catches a problem in the case note that the
// case note evaluator missed. transcriptComparison is not: it grades the
// transcription provider, not the notes.
export const LLMAJ_TRIGGER_KEYS: ReadonlySet<LlmajDimensionKey> = new Set([
  "caseNote",
  "actionItems",
  "overall",
]);

export interface LlmajDimension {
  key: LlmajDimensionKey;
  label: string;
  gradeOrWinner: string;
  rationale: string;
  hallucinations: string[];
  omissions: string[];
  providerGrades?: { assemblyai: string; deepgram: string };
  bad: boolean;
}

/** Flatten EvaluationScores into a uniform list of dimensions, noting which are BAD. */
export function extractLlmajDimensions(
  scores: EvaluationScores,
): LlmajDimension[] {
  const dimensions: LlmajDimension[] = [];

  for (const key of ["caseNote", "actionItems", "overall"] as const) {
    const score = scores[key] as TextEvaluatorOutput | null;
    if (!score) continue;
    dimensions.push({
      key,
      label: LLMAJ_DIMENSION_LABELS[key],
      gradeOrWinner: score.grade,
      rationale: score.rationale,
      hallucinations: score.hallucinations,
      omissions: score.omissions,
      bad: score.grade === "BAD",
    });
  }

  const transcript =
    scores.transcriptComparison as TranscriptComparisonOutput | null;
  if (transcript) {
    dimensions.push({
      key: "transcriptComparison",
      label: LLMAJ_DIMENSION_LABELS.transcriptComparison,
      gradeOrWinner: transcript.winner,
      rationale: transcript.rationale,
      hallucinations: [],
      omissions: [],
      providerGrades: {
        assemblyai: transcript.assemblyAiGrade,
        deepgram: transcript.deepgramGrade,
      },
      bad:
        transcript.assemblyAiGrade === "BAD" ||
        transcript.deepgramGrade === "BAD",
    });
  }

  return dimensions;
}
