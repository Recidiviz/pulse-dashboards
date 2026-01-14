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

import { Person } from "~@meetings/prisma/types";
import { SpecialistCore } from "~@meetings/tasks/llm/agents";
import {
  draftingGuard,
  extractionGuard,
  transcriptGuard,
} from "~@meetings/tasks/llm/guards";
import {
  AgencyConfig,
  DraftingOutputSchema,
  ExtractionOutputSchema,
  PipelineOutput,
  TranscriptInput,
  TranscriptInputSchema,
} from "~@meetings/tasks/llm/schemas";
import { createLogger } from "~server-setup-plugin";

export class ProductionPipeline {
  private core: SpecialistCore;
  private maxDraftingAttempts = 3;

  constructor(core?: SpecialistCore) {
    this.core = core ?? SpecialistCore.factory();
  }

  /**
   * Main pipeline execution with structured logging
   */
  async run(
    agency: AgencyConfig,
    person: Person,
    transcript: TranscriptInput,
  ): Promise<PipelineOutput> {
    const logger = createLogger("meetings.llm.orchestrator", {
      person_id: person.pseudonymizedId,
      state_code: person.stateCode,
    });

    logger.info("Starting pipeline", {
      transcript_length: transcript.rawText.length,
      transcript_duration_seconds: transcript.durationSeconds,
    });

    // STEP 0: TRANSCRIPT CHECK
    const gatekeeperResult = transcriptGuard(TranscriptInputSchema, transcript);

    if (!gatekeeperResult.valid) {
      logger.error(`Gatekeeper check failed: ${gatekeeperResult.message}`, {
        error_type: gatekeeperResult.errorKind,
        message: gatekeeperResult.message,
      });
      throw new Error(
        gatekeeperResult.message || "Transcript validation failed",
      );
    }

    // STEP 1: EXTRACTION AGENT
    const facts = await this.core.runExtraction(transcript, person, agency);

    const extractionResult = extractionGuard(ExtractionOutputSchema, facts);
    if (!extractionResult.valid) {
      logger.error("Extraction validation failed", {
        error_type: extractionResult.errorKind,
        message: extractionResult.message,
      });
    }

    if (facts.actionItems.length === 0) {
      logger.warning("Extraction found no action items", {
        updates_count: facts.criticalUpdates.length,
      });
    }

    // STEP 2: WRITER AGENT (Drafting Loop with Retry)
    let finalPayload: Awaited<ReturnType<typeof this.core.runDrafting>> | null =
      null;

    for (let attempt = 0; attempt < this.maxDraftingAttempts; attempt++) {
      logger.info("Starting drafting attempt", {
        attempt: attempt + 1,
        max_retries: this.maxDraftingAttempts,
      });

      // eslint-disable-next-line no-await-in-loop
      const draft = await this.core.runDrafting(
        transcript,
        facts,
        agency,
        person,
      );

      const draftingResult = draftingGuard(
        DraftingOutputSchema,
        draft,
        agency.noteConfig,
      );

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
    const verification = await this.core.runVerification(
      transcript,
      facts,
      person,
    );

    logger.info("Pipeline completed successfully");

    // STEP 4: FINAL ASSEMBLY
    if (!finalPayload) {
      throw new Error("Drafting failed after all retry attempts");
    }

    return {
      caseNote: finalPayload.caseNote,
      meetingMinutes: finalPayload.minutes,
      actionItems: verification.actionItems,
      statusUpdates: verification.criticalUpdates,
    };
  }
}
