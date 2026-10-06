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
  extractLlmajDimensions,
  LLMAJ_TRIGGER_KEYS,
} from "~@meetings/tasks/admin/llmaj-grades";
import type {
  EvaluationScores,
  TextEvaluatorOutput,
} from "~@meetings/tasks/llm/evaluators/schemas";

function textScore(grade: TextEvaluatorOutput["grade"]): TextEvaluatorOutput {
  return {
    grade,
    rationale: `graded ${grade}`,
    hallucinations: [],
    omissions: [],
  };
}

function scores(overrides: Partial<EvaluationScores> = {}): EvaluationScores {
  return {
    transcriptComparison: null,
    caseNote: null,
    actionItems: null,
    overall: null,
    ...overrides,
  };
}

describe("extractLlmajDimensions", () => {
  test("flattens each graded dimension, marking BAD ones", () => {
    const dimensions = extractLlmajDimensions(
      scores({
        caseNote: textScore("BAD"),
        actionItems: textScore("GOOD"),
        overall: textScore("PARTIAL"),
      }),
    );

    expect(dimensions.map((d) => [d.key, d.gradeOrWinner, d.bad])).toEqual([
      ["caseNote", "BAD", true],
      ["actionItems", "GOOD", false],
      ["overall", "PARTIAL", false],
    ]);
  });

  test("skips dimensions the evaluator didn't score", () => {
    const dimensions = extractLlmajDimensions(
      scores({ caseNote: textScore("GOOD") }),
    );

    expect(dimensions.map((d) => d.key)).toEqual(["caseNote"]);
  });

  test("carries hallucinations and omissions through", () => {
    const dimensions = extractLlmajDimensions(
      scores({
        caseNote: {
          ...textScore("BAD"),
          hallucinations: ["invented a home visit"],
          omissions: ["missed the housing update"],
        },
      }),
    );

    expect(dimensions[0].hallucinations).toEqual(["invented a home visit"]);
    expect(dimensions[0].omissions).toEqual(["missed the housing update"]);
  });

  test("reports transcript comparison with per-provider grades", () => {
    const dimensions = extractLlmajDimensions(
      scores({
        transcriptComparison: {
          rationale: "deepgram dropped the second half",
          winner: "ASSEMBLYAI",
          assemblyAiGrade: "GOOD",
          deepgramGrade: "BAD",
        },
      }),
    );

    expect(dimensions[0]).toMatchObject({
      key: "transcriptComparison",
      gradeOrWinner: "ASSEMBLYAI",
      providerGrades: { assemblyai: "GOOD", deepgram: "BAD" },
      bad: true,
    });
  });

  test("transcript comparison is never a trigger, however bad it grades", () => {
    // It's a transcription-provider signal, not a notetaking-quality one, so
    // it can never flag a meeting on its own.
    expect(LLMAJ_TRIGGER_KEYS.has("transcriptComparison")).toBe(false);
  });

  test("case note, action items and overall are triggers", () => {
    expect([...LLMAJ_TRIGGER_KEYS].sort()).toEqual([
      "actionItems",
      "caseNote",
      "overall",
    ]);
  });
});
