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
 * Specialist Core - AI Agents
 *
 * Implements the three-agent architecture:
 * - Extraction Agent (GPT-5): Extracts action items and status changes
 * - Writer Agent (GPT-5): Drafts case notes and meeting minutes
 * - Auditor Agent (Gemini-2.5-Flash): Finds verbatim citations for verification
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import dedent from "dedent";
import { wrapOpenAI } from "langsmith/wrappers";
import OpenAI from "openai";

import type { Person } from "~@meetings/prisma/types";
import { generateContentWithZodSchema } from "~@meetings/tasks/llm/clients/gemini";
import { completeChatWithZodSchema } from "~@meetings/tasks/llm/clients/openai";
import { PROMPTS } from "~@meetings/tasks/llm/prompts";
import {
  AgencyConfig,
  DraftingOutput,
  DraftingOutputSchema,
  ExtractionOutput,
  ExtractionOutputSchema,
  TranscriptInput,
  VerificationEntry,
  VerificationOutput,
  VerificationPayloadSchema,
} from "~@meetings/tasks/llm/schemas";
import { createLogger } from "~server-setup-plugin";

export class SpecialistCore {
  private openai: OpenAI;
  private gemini: GoogleGenerativeAI;

  static factory(): SpecialistCore {
    const openaiKey = process.env["OPENAI_API_KEY"];
    const geminiKey = process.env["GOOGLE_API_KEY"];

    if (!openaiKey || !geminiKey) {
      throw new Error(
        "Missing API keys. Set OPENAI_API_KEY and GOOGLE_API_KEY environment variables.",
      );
    }

    // LangSmith environment variables (optional):
    // - LANGCHAIN_API_KEY: API key for LangSmith
    // - LANGCHAIN_PROJECT: Project name (e.g., "Meetings Module (development)")
    // - LANGCHAIN_TRACING_V2: Set to "true" to enable tracing
    const langsmithEnabled = Boolean(process.env["LANGCHAIN_API_KEY"]);

    const baseOpenAI = new OpenAI({
      apiKey: openaiKey,
      baseURL: "https://us.api.openai.com/v1",
    });

    return new SpecialistCore({
      openai: langsmithEnabled ? wrapOpenAI(baseOpenAI) : baseOpenAI,
      gemini: new GoogleGenerativeAI(geminiKey),
    });
  }

  constructor({
    openai,
    gemini,
  }: {
    openai: OpenAI;
    gemini: GoogleGenerativeAI;
  }) {
    if (openai.baseURL != "https://us.api.openai.com/v1") {
      throw new Error("Must use US-based OpenAI client");
    }
    this.openai = openai;
    this.gemini = gemini;
  }

  /**
   * STEP 1: Extraction Agent
   * Compares transcript vs. history and extracts "The Diff" (Actions/Updates)
   */
  async runExtraction(
    transcript: TranscriptInput,
    person: Person,
    agency: AgencyConfig,
  ): Promise<ExtractionOutput> {
    const agentLogger = createLogger("meetings.llm.agents.extraction", {
      person_id: person.pseudonymizedId,
      state_code: person.stateCode,
    });

    agentLogger.info("Starting extraction agent", {
      transcript_length: transcript.rawText.length,
      transcript_duration_seconds: transcript.durationSeconds,
    });

    const agencyRulesStr = agency.operationalRules
      .map((r) => `- ${r}`)
      .join("\n");

    const userMessage = PROMPTS.EXTRACTION.USER({
      agencySpecificRules: agencyRulesStr,
      transcript: transcript.rawText,
    });

    try {
      const extracted = await completeChatWithZodSchema({
        client: this.openai,
        schema: ExtractionOutputSchema,
        messages: [
          { role: "system", content: PROMPTS.EXTRACTION.SYSTEM() },
          { role: "user", content: userMessage },
        ],
      });

      agentLogger.info("Extraction agent completed", {
        action_items_count: extracted.actionItems.length,
        updates_count: extracted.criticalUpdates.length,
        entities_count: extracted.entities.length,
      });

      return extracted;
    } catch (e) {
      agentLogger.error("Extraction agent failed", {
        err: e instanceof Error ? e : String(e),
      });
      return { actionItems: [], criticalUpdates: [], entities: [] };
    }
  }

  /**
   * STEP 2: Writer Agent
   * Synthesizes case notes and minutes using extracted facts
   */
  async runDrafting(
    transcript: TranscriptInput,
    facts: ExtractionOutput,
    agency: AgencyConfig,
    person: Person,
  ): Promise<DraftingOutput> {
    const agentLogger = createLogger("meetings.llm.agents.drafting", {
      person_id: person.pseudonymizedId,
      state_code: person.stateCode,
    });

    agentLogger.info("Starting drafting agent", {
      note_structure: agency.noteConfig.structureName,
      action_items_count: facts.actionItems.length,
      updates_count: facts.criticalUpdates.length,
    });

    const glossaryStr = Object.entries(agency.glossary)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const entityDict = facts.entities.reduce(
      (acc, e) => ({ ...acc, [e.value]: e.entityKind }),
      {},
    );
    const factsStr = dedent`ACTIONS: ${facts.actionItems.length} found
      UPDATES: ${facts.criticalUpdates.length} found
      ENTITIES: ${JSON.stringify(entityDict)}`;
    const clientContextStr = `Client: ${person.givenNames} ${person.surname}`;

    let structureDesc = `Structure Name: ${agency.noteConfig.structureName}\n`;
    for (const section of agency.noteConfig.sections) {
      structureDesc += `- ${section.sectionId}: ${section.instruction}\n`;
    }

    const userMessage = PROMPTS.WRITER.USER({
      transcript: transcript.rawText,
      extracted: factsStr,
      glossary: glossaryStr,
      client: clientContextStr,
      structure: structureDesc,
      poNotes: transcript.poNotes,
    });

    try {
      const result = await completeChatWithZodSchema({
        client: this.openai,
        schema: DraftingOutputSchema,
        messages: [
          { role: "system", content: PROMPTS.WRITER.SYSTEM() },
          { role: "user", content: userMessage },
        ],
      });

      agentLogger.info("Drafting agent completed", {
        minutes_count: result.minutes.length,
        case_note_length: result.caseNote.length,
      });

      return result;
    } catch (e) {
      agentLogger.error("Drafting agent failed", {
        err: e instanceof Error ? e : String(e),
      });
      return { caseNote: "[Error]", minutes: [] };
    }
  }

  /**
   * STEP 3: Verification Agent
   * Uses Gemini to find citations for extracted items
   */
  async runVerification(
    transcript: TranscriptInput,
    facts: ExtractionOutput,
    person: Person,
  ): Promise<VerificationOutput> {
    const agentLogger = createLogger("meetings.llm.agents.verification", {
      person_id: person.pseudonymizedId,
      state_code: person.stateCode,
    });

    agentLogger.info("Starting verification agent", {
      claims_to_verify: facts.actionItems.length + facts.criticalUpdates.length,
    });

    if (facts.actionItems.length === 0 && facts.criticalUpdates.length === 0) {
      agentLogger.info("Verification agent skipped - no claims to verify");
      return facts;
    }

    // Prepare claims
    const claimsList: string[] = [];
    facts.actionItems.forEach((item, i) => {
      claimsList.push(`ID: ACT_${i} | Task: ${item.task}`);
    });
    facts.criticalUpdates.forEach((item, i) => {
      claimsList.push(
        `ID: UPD_${i} | Update: ${item.category} - ${item.details}`,
      );
    });

    const claimsStr = claimsList.join("\n");
    const userMessage = PROMPTS.AUDITOR.USER({
      claims: claimsStr,
      transcript: transcript.rawText,
    });

    try {
      const evidence = await generateContentWithZodSchema({
        client: this.gemini,
        systemInstruction: PROMPTS.AUDITOR.SYSTEM(),
        userMessage,
        schema: VerificationPayloadSchema,
      });

      // Re-attach evidence
      const auditMap = new Map<string, VerificationEntry>(
        evidence.verifications.map((v: VerificationEntry) => [v.claimId, v]),
      );

      facts.actionItems.forEach((item, i) => {
        const key = `ACT_${i}`;
        const audit = auditMap.get(key);
        if (audit) {
          const quotes = audit.evidenceQuotes
            .map((q: string) => `> "${q}"`)
            .join("\n");
          item.context = (item.context || "") + `\n\n[EVIDENCE]:\n${quotes}`;
        }
      });

      facts.criticalUpdates.forEach((item, i) => {
        const key = `UPD_${i}`;
        const audit = auditMap.get(key);
        if (audit) {
          const quotes = audit.evidenceQuotes
            .map((q: string) => `> "${q}"`)
            .join("\n");
          item.evidence = quotes;
        }
      });

      agentLogger.info("Verification agent completed", {
        verifications_count: evidence.verifications.length,
      });

      return facts;
    } catch (e) {
      agentLogger.warning(
        "Verification agent failed - returning unverified facts",
        {
          error: e instanceof Error ? e.message : String(e),
          error_stack: e instanceof Error ? e.stack : undefined,
        },
      );
      return facts;
    }
  }
}
