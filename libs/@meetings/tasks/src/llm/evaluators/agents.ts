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

import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { traceable } from "langsmith/traceable";

import {
  generateContentWithZodSchema,
  uploadAudioToGemini,
} from "~@meetings/tasks/llm/clients/gemini";
import { EVALUATOR_PROMPTS } from "~@meetings/tasks/llm/evaluators/prompts";
import {
  EvaluatorInputs,
  TextEvaluatorOutput,
  TextEvaluatorOutputSchema,
  TranscriptComparisonLlmOutputSchema,
  TranscriptComparisonOutput,
  TranscriptQualityOutputSchema,
} from "~@meetings/tasks/llm/evaluators/schemas";

async function runTranscriptComparisonInternal(
  gemini: GoogleGenerativeAI,
  fileManager: GoogleAIFileManager,
  inputs: Pick<
    EvaluatorInputs,
    "audioBucket" | "audioPath" | "transcriptsByProvider" | "meetingContext"
  >,
  timeout?: number,
  tracingEnabled = true,
): Promise<TranscriptComparisonOutput> {
  const assemblyAiTranscript = inputs.transcriptsByProvider["assemblyai"];
  const deepgramTranscript = inputs.transcriptsByProvider["deepgram"];

  if (!assemblyAiTranscript && !deepgramTranscript) {
    return {
      rationale: "No transcript provider ran for this meeting.",
      winner: "NONE",
      assemblyAiGrade: "NONE",
      deepgramGrade: "NONE",
    };
  }

  if (process.env["IS_LOCAL_MODE"] === "true") {
    return {
      rationale:
        "Audio file unavailable in local mode (cleaned up before evaluation runs).",
      winner: "NONE",
      assemblyAiGrade: "NONE",
      deepgramGrade: "NONE",
    };
  }

  const { uri: audioUri, mimeType: audioMimeType } = await uploadAudioToGemini(
    fileManager,
    inputs.audioBucket,
    inputs.audioPath,
  );
  const audioPart: Part = {
    fileData: { mimeType: audioMimeType, fileUri: audioUri },
  };

  if (assemblyAiTranscript && deepgramTranscript) {
    return generateContentWithZodSchema({
      client: gemini,
      systemInstruction: EVALUATOR_PROMPTS.TRANSCRIPT_COMPARISON.SYSTEM,
      parts: [
        audioPart,
        {
          text: EVALUATOR_PROMPTS.TRANSCRIPT_COMPARISON.USER({
            assemblyAiTranscript,
            deepgramTranscript,
            meetingContext: inputs.meetingContext,
          }),
        },
      ],
      schema: TranscriptComparisonLlmOutputSchema,
      timeout,
      tracingEnabled,
    });
  }

  // Single provider: grade the one transcript directly against the audio.
  const { grade, ...quality } = await generateContentWithZodSchema({
    client: gemini,
    systemInstruction: EVALUATOR_PROMPTS.TRANSCRIPT_QUALITY.SYSTEM,
    parts: [
      audioPart,
      {
        text: EVALUATOR_PROMPTS.TRANSCRIPT_QUALITY.USER({
          transcript: assemblyAiTranscript || deepgramTranscript || "",
          meetingContext: inputs.meetingContext,
        }),
      },
    ],
    schema: TranscriptQualityOutputSchema,
    timeout,
    tracingEnabled,
  });

  return {
    ...quality,
    winner: "SINGLE_PROVIDER",
    assemblyAiGrade: assemblyAiTranscript ? grade : "NONE",
    deepgramGrade: deepgramTranscript ? grade : "NONE",
  };
}

async function runCaseNoteInternal(
  gemini: GoogleGenerativeAI,
  inputs: Pick<
    EvaluatorInputs,
    "bestTranscript" | "caseNote" | "meetingContext"
  >,
  timeout?: number,
  tracingEnabled = true,
): Promise<TextEvaluatorOutput> {
  return generateContentWithZodSchema({
    client: gemini,
    systemInstruction: EVALUATOR_PROMPTS.CASE_NOTE.SYSTEM,
    parts: EVALUATOR_PROMPTS.CASE_NOTE.USER({
      transcript: inputs.bestTranscript,
      caseNote: inputs.caseNote,
      meetingContext: inputs.meetingContext,
    }),
    schema: TextEvaluatorOutputSchema,
    timeout,
    tracingEnabled,
  });
}

async function runActionItemsInternal(
  gemini: GoogleGenerativeAI,
  inputs: Pick<
    EvaluatorInputs,
    "bestTranscript" | "actionItems" | "meetingContext"
  >,
  timeout?: number,
  tracingEnabled = true,
): Promise<TextEvaluatorOutput> {
  return generateContentWithZodSchema({
    client: gemini,
    systemInstruction: EVALUATOR_PROMPTS.ACTION_ITEMS.SYSTEM,
    parts: EVALUATOR_PROMPTS.ACTION_ITEMS.USER({
      transcript: inputs.bestTranscript,
      actionItems: JSON.stringify(inputs.actionItems, null, 2),
      meetingContext: inputs.meetingContext,
    }),
    schema: TextEvaluatorOutputSchema,
    timeout,
    tracingEnabled,
  });
}

async function runOverallInternal(
  gemini: GoogleGenerativeAI,
  inputs: Pick<
    EvaluatorInputs,
    "bestTranscript" | "caseNote" | "actionItems" | "meetingContext"
  >,
  timeout?: number,
  tracingEnabled = true,
): Promise<TextEvaluatorOutput> {
  return generateContentWithZodSchema({
    client: gemini,
    systemInstruction: EVALUATOR_PROMPTS.OVERALL.SYSTEM,
    parts: EVALUATOR_PROMPTS.OVERALL.USER({
      transcript: inputs.bestTranscript,
      caseNote: inputs.caseNote,
      actionItems: JSON.stringify(inputs.actionItems, null, 2),
      meetingContext: inputs.meetingContext,
    }),
    schema: TextEvaluatorOutputSchema,
    timeout,
    tracingEnabled,
  });
}

export const runTranscriptComparison = traceable(
  runTranscriptComparisonInternal,
  {
    name: "evaluator-transcript-comparison",
    run_type: "chain",
  },
);

export const runCaseNote = traceable(runCaseNoteInternal, {
  name: "evaluator-case-note",
  run_type: "chain",
});

export const runActionItems = traceable(runActionItemsInternal, {
  name: "evaluator-action-items",
  run_type: "chain",
});

export const runOverall = traceable(runOverallInternal, {
  name: "evaluator-overall",
  run_type: "chain",
});

type Evaluator<
  Internal extends (
    gemini: GoogleGenerativeAI,
    inputs: never,
    timeout?: number,
    tracingEnabled?: boolean,
  ) => unknown,
> = (
  gemini: GoogleGenerativeAI,
  inputs: Parameters<Internal>[1],
  timeout?: number,
) => ReturnType<Internal>;

type TranscriptComparisonEvaluator = (
  gemini: GoogleGenerativeAI,
  fileManager: GoogleAIFileManager,
  inputs: Parameters<typeof runTranscriptComparisonInternal>[2],
  timeout?: number,
) => ReturnType<typeof runTranscriptComparisonInternal>;

/**
 * The evaluators that runAllEvaluators runs. Both tracedEvaluators and
 * untracedEvaluators have this type, so a new evaluator has to be added to
 * both.
 */
export type Evaluators = {
  runTranscriptComparison: TranscriptComparisonEvaluator;
  runCaseNote: Evaluator<typeof runCaseNoteInternal>;
  runActionItems: Evaluator<typeof runActionItemsInternal>;
  runOverall: Evaluator<typeof runOverallInternal>;
};

/**
 * The evaluators, traced in LangSmith.
 */
export const tracedEvaluators: Evaluators = {
  runTranscriptComparison,
  runCaseNote,
  runActionItems,
  runOverall,
};

/**
 * The evaluators without LangSmith tracing, for states where
 * isTracingEnabledForState is false.
 */
export const untracedEvaluators: Evaluators = {
  runTranscriptComparison: (gemini, fileManager, inputs, timeout) =>
    runTranscriptComparisonInternal(
      gemini,
      fileManager,
      inputs,
      timeout,
      false,
    ),
  runCaseNote: (gemini, inputs, timeout) =>
    runCaseNoteInternal(gemini, inputs, timeout, false),
  runActionItems: (gemini, inputs, timeout) =>
    runActionItemsInternal(gemini, inputs, timeout, false),
  runOverall: (gemini, inputs, timeout) =>
    runOverallInternal(gemini, inputs, timeout, false),
};
