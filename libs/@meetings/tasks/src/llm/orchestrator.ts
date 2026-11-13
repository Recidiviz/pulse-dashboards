// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
 * Production Pipeline - Orchestrator
 *
 * Coordinates the multi-agent workflow:
 * 1. Extraction Agent → extracts action items and updates
 * 2. Writer Agent → drafts case notes and structured minutes (with retry loop)
 * 3. Verification Agent → finds citations for extracted claims
 */

import { getCurrentRunTree, traceable } from "langsmith/traceable";

import { type AgencyConfig, generateConfigKey } from "~@meetings/config";
import type { PrismaClient } from "~@meetings/prisma/client";
import { Person } from "~@meetings/prisma/types";
import { TranscriptValidationError } from "~@meetings/tasks/errors";
import { SpecialistCore } from "~@meetings/tasks/llm/agents";
import {
  createAgentExecution,
  createPipelineRun,
  type LlmCallMeta,
  sanitizeForPostgres,
  serializeError,
  updatePipelineRunStatus,
} from "~@meetings/tasks/llm/evaluation-store";
import {
  draftingGuard,
  extractionGuard,
  transcriptGuard,
} from "~@meetings/tasks/llm/guards";
import type { ExperimentAssignment } from "~@meetings/tasks/llm/modelAssignment";
import { PIPELINE_VERSION } from "~@meetings/tasks/llm/prompts";
import {
  DraftingOutputSchema,
  ExtractionOutput,
  ExtractionOutputSchema,
  PipelineOutput,
  TranscriptInput,
  TranscriptInputSchema,
} from "~@meetings/tasks/llm/schemas";
import { isTracingEnabledForState } from "~@meetings/tasks/llm/tracing";
import { createLogger } from "~server-setup-plugin";

export class ProductionPipeline {
  private core: SpecialistCore;
  private maxDraftingAttempts = 3;
  private prisma: PrismaClient;

  /**
   * The core must come from SpecialistCore.factory for the same state as the
   * people whose meetings this pipeline runs, so that its LangSmith tracing
   * matches the state.
   */
  constructor(prisma: PrismaClient, core: SpecialistCore) {
    this.prisma = prisma;
    this.core = core;
  }

  /**
   * Main pipeline execution with structured logging. Pass the agency and experiment from
   * assignModels to record which model experiment variant the run used.
   */
  async run(
    agency: AgencyConfig,
    person: Person,
    transcript: TranscriptInput,
    meetingId: string,
    experiment: ExperimentAssignment = {},
  ): Promise<PipelineOutput> {
    return isTracingEnabledForState(person.stateCode)
      ? this.runTraced(agency, person, transcript, meetingId, experiment)
      : this.runPipeline(agency, person, transcript, meetingId, experiment);
  }

  /**
   * Internal pipeline execution
   */
  private runPipeline = async (
    agency: AgencyConfig,
    person: Person,
    transcript: TranscriptInput,
    meetingId: string,
    { experimentId, variant }: ExperimentAssignment,
  ): Promise<PipelineOutput> => {
    const configVersion = generateConfigKey(agency);
    // Git SHA of the deployed server image; unset in previews and local runs
    const release = process.env["SENTRY_RELEASE"];
    const logger = createLogger("meetings.llm.orchestrator", {
      person_id: person.pseudonymizedId,
      state_code: person.stateCode,
      config_version: configVersion,
      pipeline_version: PIPELINE_VERSION,
      model_variant: variant,
    });
    const runTree = getCurrentRunTree(true);
    if (runTree) {
      runTree.metadata = {
        state_code: person.stateCode,
        config_version: configVersion,
        pipeline_version: PIPELINE_VERSION,
        release,
        experiment_id: experimentId,
        model_variant: variant,
      };
    }

    logger.info("Starting pipeline", {
      transcript_length: transcript.rawText.length,
      transcript_duration_seconds: transcript.durationSeconds,
    });

    // Create evaluation pipeline run if prisma client is available
    const pipelineRun = await createPipelineRun(this.prisma, {
      meetingId,
      personPseudonymizedId: person.pseudonymizedId,
      status: "IN_PROGRESS", // Will update on error
      configVersion,
      pipelineVersion: PIPELINE_VERSION,
      release,
      experimentId,
      variant,
    });

    try {
      // STEP 0: TRANSCRIPT CHECK
      const gatekeeperResult = transcriptGuard(
        TranscriptInputSchema,
        transcript,
      );

      if (!gatekeeperResult.valid) {
        logger.error(`Gatekeeper check failed: ${gatekeeperResult.message}`, {
          error_type: gatekeeperResult.errorKind,
          message: gatekeeperResult.message,
        });

        throw new TranscriptValidationError({
          message: gatekeeperResult.message,
          validationErrorType: gatekeeperResult.errorKind,
        });
      }

      // STEP 1: EXTRACTION AGENT
      let extractionCall: LlmCallMeta | undefined;
      let facts: ExtractionOutput;
      try {
        facts = await this.core.runExtraction(transcript, person, agency, {
          onCall: (call) => (extractionCall = call),
        });
      } catch (e) {
        // Record the failed call so it counts in per-model comparisons; call is unset if the
        // provider never responded
        await createAgentExecution(this.prisma, {
          pipelineRunId: pipelineRun.id,
          agentType: "EXTRACTION",
          validationResult: {
            valid: false,
            message: e instanceof Error ? e.message : String(e),
          },
          call: extractionCall,
        });
        throw e;
      }

      const extractionResult = extractionGuard(ExtractionOutputSchema, facts);
      if (!extractionResult.valid) {
        logger.error("Extraction validation failed", {
          error_type: extractionResult.errorKind,
          message: extractionResult.message,
        });
      }

      // Store extraction execution
      await createAgentExecution(this.prisma, {
        pipelineRunId: pipelineRun.id,
        agentType: "EXTRACTION",
        outputData: facts,
        validationResult: extractionResult,
        call: extractionCall,
      });

      if (facts.actionItems.length === 0) {
        logger.warning("Extraction found no action items");
      }

      // STEP 2: WRITER AGENT (Drafting Loop with Retry)
      // Produces case note, minutes, and coaching staff feedback in one call.
      let finalPayload: Awaited<
        ReturnType<typeof this.core.runDrafting>
      > | null = null;

      for (let attempt = 0; attempt < this.maxDraftingAttempts; attempt++) {
        logger.info("Starting drafting attempt", {
          attempt: attempt + 1,
          max_retries: this.maxDraftingAttempts,
        });

        let draft: Awaited<ReturnType<typeof this.core.runDrafting>>;
        let draftingCall: LlmCallMeta | undefined;
        try {
          // eslint-disable-next-line no-await-in-loop
          draft = await this.core.runDrafting(
            transcript,
            facts,
            agency,
            person,
            { onCall: (call) => (draftingCall = call) },
          );
        } catch (e) {
          logger.warning("Drafting agent call failed", {
            attempt: attempt + 1,
            error: e instanceof Error ? e.message : String(e),
          });
          // eslint-disable-next-line no-await-in-loop
          await createAgentExecution(this.prisma, {
            pipelineRunId: pipelineRun.id,
            agentType: "DRAFTING",
            attemptNumber: attempt + 1,
            validationResult: {
              valid: false,
              message: e instanceof Error ? e.message : String(e),
            },
            call: draftingCall,
          });

          if (attempt === this.maxDraftingAttempts - 1) {
            throw e;
          }
          continue;
        }

        const draftingResult = draftingGuard(DraftingOutputSchema, draft);

        // Store each drafting attempt
        // eslint-disable-next-line no-await-in-loop
        await createAgentExecution(this.prisma, {
          pipelineRunId: pipelineRun.id,
          agentType: "DRAFTING",
          attemptNumber: attempt + 1,
          outputData: draft,
          validationResult: draftingResult,
          call: draftingCall,
        });

        if (draftingResult.valid || attempt == this.maxDraftingAttempts - 1) {
          logger.info("Drafting validation passed", {
            attempt: attempt + 1,
          });
          finalPayload = draft;
          break;
        } else {
          logger.warning("Drafting validation failed - retrying", {
            attempt: attempt + 1,
            error_type: draftingResult.errorKind,
            message: draftingResult.message,
          });
        }
      }

      // STEP 3: VERIFICATION AGENT
      let verificationCall: LlmCallMeta | undefined;
      let verificationError: unknown;
      const verification = await this.core.runVerification(
        transcript,
        facts,
        person,
        {
          onCall: (call) => (verificationCall = call),
          onError: (e) => (verificationError = e),
        },
      );

      // Store verification execution. It has no guard, so it's invalid only when the call failed
      // and the facts went through without evidence.
      await createAgentExecution(this.prisma, {
        pipelineRunId: pipelineRun.id,
        agentType: "VERIFICATION",
        outputData: verification,
        validationResult:
          verificationError === undefined
            ? { valid: true }
            : {
                valid: false,
                message:
                  verificationError instanceof Error
                    ? verificationError.message
                    : String(verificationError),
              },
        call: verificationCall,
      });

      logger.info("Pipeline completed successfully");

      // STEP 4: FINAL ASSEMBLY
      if (!finalPayload) {
        throw new Error("Drafting failed after all retry attempts");
      }

      await updatePipelineRunStatus(this.prisma, pipelineRun.id, "SUCCESS");

      // The last drafting attempt is kept even if invalid, so sanitize for the meeting write
      return sanitizeForPostgres({
        caseNote: finalPayload.caseNote,
        actionItems: verification.actionItems,
        staffFeedback: finalPayload.staffFeedback,
        pipelineRunId: pipelineRun.id,
      });
    } catch (error) {
      // Update pipeline run status on any error
      await updatePipelineRunStatus(
        this.prisma,
        pipelineRun.id,
        "FAILURE",
        serializeError(error),
      );
      throw error;
    }
  };

  /**
   * runPipeline, traced in LangSmith
   */
  private runTraced = traceable(this.runPipeline, {
    name: "meetings-pipeline",
    run_type: "chain",
  });
}
