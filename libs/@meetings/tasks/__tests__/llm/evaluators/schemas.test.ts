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

import { describe, expect, test } from "vitest";

import {
  EvaluationScoresSchema,
  TextEvaluatorOutputSchema,
  TranscriptComparisonOutputSchema,
} from "~@meetings/tasks/llm/evaluators/schemas";

describe("Evaluator Schemas", () => {
  describe("TranscriptComparisonOutputSchema", () => {
    test("should validate a valid comparison with a winner", () => {
      const valid = {
        rationale: "AssemblyAI had fewer word-level errors.",
        winner: "ASSEMBLYAI",
        assemblyAiGrade: "GOOD",
        deepgramGrade: "PARTIAL",
      };

      expect(TranscriptComparisonOutputSchema.safeParse(valid).success).toBe(
        true,
      );
    });

    test("should validate SINGLE_PROVIDER result", () => {
      const singleProvider = {
        rationale: "Only one transcript provider ran for this meeting.",
        winner: "SINGLE_PROVIDER",
        assemblyAiGrade: "NONE",
        deepgramGrade: "NONE",
      };

      expect(
        TranscriptComparisonOutputSchema.safeParse(singleProvider).success,
      ).toBe(true);
    });

    test("should validate ABOUT_THE_SAME winner", () => {
      const aboutTheSame = {
        rationale: "Both transcripts are roughly equivalent.",
        winner: "ABOUT_THE_SAME",
        assemblyAiGrade: "GOOD",
        deepgramGrade: "GOOD",
      };

      expect(
        TranscriptComparisonOutputSchema.safeParse(aboutTheSame).success,
      ).toBe(true);
    });

    test("should validate NONE winner when both are bad", () => {
      const none = {
        rationale: "Both transcripts contain serious errors.",
        winner: "NONE",
        assemblyAiGrade: "BAD",
        deepgramGrade: "BAD",
      };

      expect(TranscriptComparisonOutputSchema.safeParse(none).success).toBe(
        true,
      );
    });

    test("should reject invalid winner value", () => {
      const invalid = {
        rationale: "Some rationale.",
        winner: "WINNER", // not in enum
        assemblyAiGrade: "GOOD",
        deepgramGrade: "GOOD",
      };

      expect(TranscriptComparisonOutputSchema.safeParse(invalid).success).toBe(
        false,
      );
    });

    test("should reject invalid grade value", () => {
      const invalid = {
        rationale: "Some rationale.",
        winner: "ASSEMBLYAI",
        assemblyAiGrade: "EXCELLENT", // not in enum
        deepgramGrade: "GOOD",
      };

      expect(TranscriptComparisonOutputSchema.safeParse(invalid).success).toBe(
        false,
      );
    });

    test("should reject missing required fields", () => {
      const missing = {
        rationale: "Some rationale.",
        winner: "ASSEMBLYAI",
        // missing grades
      };

      expect(TranscriptComparisonOutputSchema.safeParse(missing).success).toBe(
        false,
      );
    });
  });

  describe("TextEvaluatorOutputSchema", () => {
    test("should validate a GOOD grade with no issues", () => {
      const valid = {
        rationale: "The case note accurately reflects the transcript.",
        grade: "GOOD",
        hallucinations: [],
        omissions: [],
      };

      expect(TextEvaluatorOutputSchema.safeParse(valid).success).toBe(true);
    });

    test("should validate a PARTIAL grade with findings", () => {
      const valid = {
        rationale: "Minor inaccuracies were found.",
        grade: "PARTIAL",
        hallucinations: [
          "Client said they had a job — not mentioned in transcript",
        ],
        omissions: ["Housing status not captured"],
      };

      expect(TextEvaluatorOutputSchema.safeParse(valid).success).toBe(true);
    });

    test("should validate a BAD grade", () => {
      const valid = {
        rationale: "Serious misattributions present.",
        grade: "BAD",
        hallucinations: ["Invented drug test result"],
        omissions: ["Critical compliance date omitted"],
      };

      expect(TextEvaluatorOutputSchema.safeParse(valid).success).toBe(true);
    });

    test("should reject invalid grade value", () => {
      const invalid = {
        rationale: "Some rationale.",
        grade: "EXCELLENT", // not in enum
        hallucinations: [],
        omissions: [],
      };

      expect(TextEvaluatorOutputSchema.safeParse(invalid).success).toBe(false);
    });

    test("should reject missing hallucinations array", () => {
      const invalid = {
        rationale: "Some rationale.",
        grade: "GOOD",
        omissions: [],
        // missing hallucinations
      };

      expect(TextEvaluatorOutputSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe("EvaluationScoresSchema", () => {
    test("should validate all-null scores (evaluators all failed)", () => {
      const allNull = {
        transcriptComparison: null,
        caseNote: null,
        actionItems: null,
        overall: null,
      };

      expect(EvaluationScoresSchema.safeParse(allNull).success).toBe(true);
    });

    test("should validate complete scores with all fields populated", () => {
      const textResult = {
        rationale: "Looks good.",
        grade: "GOOD" as const,
        hallucinations: [],
        omissions: [],
      };

      const complete = {
        transcriptComparison: {
          rationale: "AssemblyAI is better.",
          winner: "ASSEMBLYAI",
          assemblyAiGrade: "GOOD",
          deepgramGrade: "PARTIAL",
        },
        caseNote: textResult,
        actionItems: textResult,
        overall: textResult,
      };

      expect(EvaluationScoresSchema.safeParse(complete).success).toBe(true);
    });

    test("should validate mixed null and populated scores", () => {
      const mixed = {
        transcriptComparison: null,
        caseNote: {
          rationale: "Accurate.",
          grade: "GOOD",
          hallucinations: [],
          omissions: [],
        },
        actionItems: null,
        overall: null,
      };

      expect(EvaluationScoresSchema.safeParse(mixed).success).toBe(true);
    });

    test("should reject missing keys", () => {
      const incomplete = {
        transcriptComparison: null,
        caseNote: null,
        // missing actionItems, overall
      };

      expect(EvaluationScoresSchema.safeParse(incomplete).success).toBe(false);
    });
  });
});
