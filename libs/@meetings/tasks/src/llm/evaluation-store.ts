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

/**
 * Evaluation Store - LLM Pipeline Evaluation Storage
 *
 * Provides repository functions for storing LLM pipeline runs and agent executions
 * to Postgres for manual quality evaluation.
 */

import { getCurrentRunTree } from "langsmith/traceable";

import type { PrismaClient } from "~@meetings/prisma/client";
import type {
  NotetakingAgentType,
  NotetakingPipelineStatus,
} from "~@meetings/prisma/client";
import type { ValidationResult } from "~@meetings/tasks/llm/guards";
import type {
  DraftingOutput,
  ExtractionOutput,
  VerificationOutput,
} from "~@meetings/tasks/llm/schemas";

// ==========================================
// TYPES
// ==========================================

export interface ErrorDetails {
  message: string;
  stack?: string;
  name?: string;
  cause?: unknown;
}

export interface CreatePipelineRunParams {
  meetingId: string;
  personPseudonymizedId: string;
  status: NotetakingPipelineStatus;
  errorDetails?: ErrorDetails;
}

export interface CreateAgentExecutionParams {
  pipelineRunId: string;
  agentType: NotetakingAgentType;
  attemptNumber?: number;
  outputData: ExtractionOutput | DraftingOutput | VerificationOutput;
  validationResult: ValidationResult;
}

// ==========================================
// HELPERS
// ==========================================

/**
 * Extracts the LangSmith trace ID from the current run tree context
 */
export function getLangsmithTraceId(): string | undefined {
  try {
    const runTree = getCurrentRunTree();
    return runTree?.trace_id;
  } catch {
    // Not in a LangSmith traceable context
    return undefined;
  }
}

/**
 * Serializes an error object to JSON format with stack trace
 */
export function serializeError(error: Error | unknown): ErrorDetails {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
    };
  }

  return {
    message: String(error),
    name: "UnknownError",
  };
}

// ==========================================
// REPOSITORY FUNCTIONS
// ==========================================

/**
 * Creates a new notetaking pipeline run record
 */
export async function createPipelineRun(
  prisma: PrismaClient,
  params: CreatePipelineRunParams,
) {
  const langsmithTraceId = getLangsmithTraceId();

  return await prisma.notetakingPipelineRun.create({
    data: {
      meetingId: params.meetingId,
      langsmithTraceId,
      personPseudonymizedId: params.personPseudonymizedId,
      status: params.status,
      errorDetails: params.errorDetails,
    },
  });
}

/**
 * Updates the status of an existing pipeline run
 */
export async function updatePipelineRunStatus(
  prisma: PrismaClient,
  pipelineRunId: string,
  status: NotetakingPipelineStatus,
  errorDetails?: ErrorDetails,
) {
  return await prisma.notetakingPipelineRun.update({
    where: { id: pipelineRunId },
    data: {
      status,
      errorDetails,
    },
  });
}

/**
 * Creates a new agent execution record
 */
export async function createAgentExecution(
  prisma: PrismaClient,
  params: CreateAgentExecutionParams,
) {
  return await prisma.notetakingAgentExecution.create({
    data: {
      pipelineRunId: params.pipelineRunId,
      agentType: params.agentType,
      attemptNumber: params.attemptNumber ?? 1,
      outputData: params.outputData,
      validationResult: params.validationResult,
    },
  });
}
