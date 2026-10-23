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

import { traceable } from "langsmith/traceable";

import { createVertexGeminiClient } from "~@meetings/tasks/llm/clients/gemini";
import { getLangsmithTraceId } from "~@meetings/tasks/llm/evaluation-store";
import {
  tracedEvaluators,
  untracedEvaluators,
} from "~@meetings/tasks/llm/evaluators/agents";
import {
  EvaluationScores,
  EvaluatorClients,
  EvaluatorInputs,
} from "~@meetings/tasks/llm/evaluators/schemas";
import { isTracingEnabledForState } from "~@meetings/tasks/llm/tracing";
import { createLogger } from "~server-setup-plugin";

const logger = createLogger("meetings.llm.evaluators");

type EvaluatorResult = {
  scores: EvaluationScores;
  langsmithTraceId: string | undefined;
};

const evaluateAll = async (
  clients: EvaluatorClients,
  inputs: EvaluatorInputs,
): Promise<EvaluatorResult> => {
  const { gemini, timeout } = clients;
  const evaluators =
    clients.tracingEnabled === false ? untracedEvaluators : tracedEvaluators;

  const [transcriptComparison, caseNote, actionItems, overall] =
    await Promise.allSettled([
      evaluators.runTranscriptComparison(
        gemini,
        {
          audioBucket: inputs.audioBucket,
          audioPath: inputs.audioPath,
          transcriptsByProvider: inputs.transcriptsByProvider,
          meetingContext: inputs.meetingContext,
        },
        timeout,
      ),
      evaluators.runCaseNote(
        gemini,
        {
          bestTranscript: inputs.bestTranscript,
          caseNote: inputs.caseNote,
          meetingContext: inputs.meetingContext,
        },
        timeout,
      ),
      evaluators.runActionItems(
        gemini,
        {
          bestTranscript: inputs.bestTranscript,
          actionItems: inputs.actionItems,
          meetingContext: inputs.meetingContext,
        },
        timeout,
      ),
      evaluators.runOverall(
        gemini,
        {
          bestTranscript: inputs.bestTranscript,
          caseNote: inputs.caseNote,
          actionItems: inputs.actionItems,
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
      overall: overall.status === "fulfilled" ? overall.value : null,
    },
    langsmithTraceId: getLangsmithTraceId(),
  };
};

const evaluateAllTraced = traceable(evaluateAll, {
  name: "evaluator-pipeline",
  run_type: "chain",
});

/**
 * Run all evaluators for a single pipeline run and return the combined scores.
 * Individual evaluator failures are captured as null rather than aborting the run.
 * Runs concurrently via Promise.allSettled so all evaluators execute in parallel.
 * Traced in LangSmith unless clients.tracingEnabled is false.
 */
export function runAllEvaluators(
  clients: EvaluatorClients,
  inputs: EvaluatorInputs,
): Promise<EvaluatorResult> {
  return clients.tracingEnabled === false
    ? evaluateAll(clients, inputs)
    : evaluateAllTraced(clients, inputs);
}

/**
 * Builds EvaluatorClients that call Gemini on Vertex AI for evaluations of
 * meetings in stateCode.
 * Throws if GOOGLE_CLOUD_PROJECT is not set.
 */
export function createEvaluatorClients(stateCode: string): EvaluatorClients {
  return {
    gemini: createVertexGeminiClient(),
    timeout: 1800000,
    tracingEnabled: isTracingEnabledForState(stateCode),
  };
}
