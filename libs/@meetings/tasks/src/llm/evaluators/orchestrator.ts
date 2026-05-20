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
import { Client as LangSmithClient } from "langsmith";
import { traceable } from "langsmith/traceable";

import { getLangsmithTraceId } from "~@meetings/tasks/llm/evaluation-store";
import {
  runActionItems,
  runCaseNote,
  runCriticalUpdates,
  runOverall,
  runTranscriptComparison,
} from "~@meetings/tasks/llm/evaluators/agents";
import {
  EvaluationScores,
  EvaluatorClients,
  EvaluatorInputs,
} from "~@meetings/tasks/llm/evaluators/schemas";
import { createLogger } from "~server-setup-plugin";

export const langsmithClient = new LangSmithClient();
const logger = createLogger("meetings.llm.evaluators");

/**
 * Run all evaluators for a single pipeline run and return the combined scores.
 * Individual evaluator failures are captured as null rather than aborting the run.
 * Runs concurrently via Promise.allSettled so all evaluators execute in parallel.
 */
export const runAllEvaluators = traceable(
  async (
    clients: EvaluatorClients,
    inputs: EvaluatorInputs,
  ): Promise<{
    scores: EvaluationScores;
    langsmithTraceId: string | undefined;
  }> => {
    const { gemini, fileManager, timeout } = clients;

    const [
      transcriptComparison,
      caseNote,
      actionItems,
      criticalUpdates,
      overall,
    ] = await Promise.allSettled([
      runTranscriptComparison(
        gemini,
        fileManager,
        {
          audioBucket: inputs.audioBucket,
          audioPath: inputs.audioPath,
          transcriptsByProvider: inputs.transcriptsByProvider,
          meetingContext: inputs.meetingContext,
        },
        timeout,
      ),
      runCaseNote(
        gemini,
        {
          bestTranscript: inputs.bestTranscript,
          caseNote: inputs.caseNote,
          meetingContext: inputs.meetingContext,
        },
        timeout,
      ),
      runActionItems(
        gemini,
        {
          bestTranscript: inputs.bestTranscript,
          actionItems: inputs.actionItems,
          meetingContext: inputs.meetingContext,
        },
        timeout,
      ),
      runCriticalUpdates(
        gemini,
        {
          bestTranscript: inputs.bestTranscript,
          criticalUpdates: inputs.criticalUpdates,
          meetingContext: inputs.meetingContext,
        },
        timeout,
      ),
      runOverall(
        gemini,
        {
          bestTranscript: inputs.bestTranscript,
          caseNote: inputs.caseNote,
          actionItems: inputs.actionItems,
          criticalUpdates: inputs.criticalUpdates,
          meetingContext: inputs.meetingContext,
        },
        timeout,
      ),
    ]);

    const logIfRejected = (
      result: PromiseSettledResult<unknown>,
      name: string,
    ) => {
      if (result.status === "rejected") {
        logger.error(`${name} evaluator failed`, {
          err:
            result.reason instanceof Error
              ? result.reason
              : String(result.reason),
        });
      }
    };

    logIfRejected(transcriptComparison, "Transcript comparison");
    logIfRejected(caseNote, "Case note");
    logIfRejected(actionItems, "Action items");
    logIfRejected(criticalUpdates, "Critical updates");
    logIfRejected(overall, "Overall");

    return {
      scores: {
        transcriptComparison:
          transcriptComparison.status === "fulfilled"
            ? transcriptComparison.value
            : null,
        caseNote: caseNote.status === "fulfilled" ? caseNote.value : null,
        actionItems:
          actionItems.status === "fulfilled" ? actionItems.value : null,
        criticalUpdates:
          criticalUpdates.status === "fulfilled" ? criticalUpdates.value : null,
        overall: overall.status === "fulfilled" ? overall.value : null,
      },
      langsmithTraceId: getLangsmithTraceId(),
    };
  },
  {
    name: "evaluator-pipeline",
    run_type: "chain",
    client: langsmithClient,
  },
);

/**
 * Build EvaluatorClients from environment variables.
 * Throws if GOOGLE_API_KEY is not set.
 */
export function createEvaluatorClients(): EvaluatorClients {
  const geminiKey = process.env["GOOGLE_API_KEY"];
  if (!geminiKey) {
    throw new Error("Missing GOOGLE_API_KEY environment variable");
  }

  return {
    gemini: new GoogleGenerativeAI(geminiKey),
    fileManager: new GoogleAIFileManager(geminiKey),
    timeout: 1800000,
  };
}
