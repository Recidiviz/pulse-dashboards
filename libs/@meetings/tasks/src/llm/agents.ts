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
import { z } from "zod";

import { generateConfigKey } from "~@meetings/config";
import type {
  AgencyConfig,
  MeetingTypeConfigEntry,
} from "~@meetings/config/types";
import { Resident } from "~@meetings/prisma/client";
import type { Person } from "~@meetings/prisma/types";
import { generateContentWithZodSchema } from "~@meetings/tasks/llm/clients/gemini";
import { completeChatWithZodSchema } from "~@meetings/tasks/llm/clients/openai";
import { PROMPTS } from "~@meetings/tasks/llm/prompts";
import {
  DraftingOutput,
  DraftingOutputSchema,
  ExtractionOutput,
  ExtractionOutputSchema,
  TranscriptInput,
  VerificationEntry,
  VerificationOutput,
  VerificationPayloadSchema,
} from "~@meetings/tasks/llm/schemas";
import { normalizeNameCasing } from "~@meetings/tasks/llm/utils";
import { createLogger } from "~server-setup-plugin";

function buildMeetingTypeExtractionContext(
  config: MeetingTypeConfigEntry | undefined,
): string {
  if (!config?.extractionNote) {
    return "";
  }
  return `\n- Meeting Type Context: ${config.extractionNote}`;
}

function buildMeetingTypeCaseNoteGuidance(
  config: MeetingTypeConfigEntry | undefined,
): string {
  if (!config?.caseNoteGuidance) {
    return "";
  }
  return `\nMeeting Type Context: ${config.caseNoteGuidance}`;
}

/**
 * Agency-specific supplemental outputs (agency.additionalOutputs) each get
 * their own section in the SYSTEM prompt, separate from the case-note NOTE
 * STRUCTURE, so the writer doesn't have to blend unrelated instructions into
 * one section. Returns "" when the agency has none configured.
 */
function buildAdditionalOutputsSection(agency: AgencyConfig): string {
  if (agency.additionalOutputs.length === 0) {
    return "";
  }
  const sections = agency.additionalOutputs
    .map(
      (output) => dedent`
        #### ${output.label}
        ${output.promptGuidance}`,
    )
    .join("\n\n");
  return dedent`
    ### ADDITIONAL OUTPUTS
    The items below are agency-specific supplemental outputs, on top of the
    three fixed outputs above. For each one: follow its instructions, write
    plain prose (no codes, IDs, or structured data), and do not add your own
    section header - one will be added automatically. If its instructions
    say to omit the output under certain conditions, return an empty string
    for it instead of forcing content.

    ${sections}`;
}

/**
 * Extends DraftingOutputSchema with one required string field per
 * agency.additionalOutputs entry, keyed by output id, so each supplemental
 * output gets validated as its own field rather than folded into caseNote
 * by the model itself.
 */
function buildDraftingOutputSchema(
  agency: AgencyConfig,
): z.ZodType<DraftingOutput & Record<string, string>> {
  const schema =
    agency.additionalOutputs.length === 0
      ? DraftingOutputSchema
      : DraftingOutputSchema.extend(
          Object.fromEntries(
            agency.additionalOutputs.map((output) => [
              output.id,
              z
                .string()
                .describe(
                  `Prose content for the "${output.label}" additional output. Empty string if not applicable to this meeting.`,
                ),
            ]),
          ),
        );
  // extend()'s inferred type drops caseNote/staffFeedback here, since
  // Object.fromEntries's index signature makes keyof Augmentation `string`,
  // and Omit<Shape, string> clears every known key (the runtime schema is
  // unaffected - extend() still adds the new fields). The ids are runtime
  // data, so TS can't know them as literal keys - assert the real shape
  // once here instead of at every call site.
  return schema as unknown as z.ZodType<
    DraftingOutput & Record<string, string>
  >;
}
const isResident = (p: Person): p is Resident => "facilityId" in p;

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
    // - LANGSMITH_API_KEY or LANGCHAIN_API_KEY: API key for LangSmith (either name enables tracing)
    // - LANGCHAIN_PROJECT: Project name (e.g., "Meetings Module (development)")
    // - LANGCHAIN_TRACING_V2: Set to "true" to enable tracing
    const langsmithEnabled = Boolean(
      process.env["LANGSMITH_API_KEY"] ?? process.env["LANGCHAIN_API_KEY"],
    );

    const baseOpenAI = new OpenAI({
      apiKey: openaiKey,
      baseURL: "https://us.api.openai.com/v1",
      // Explicit retry/timeout config (rather than relying on SDK defaults)
      // so rate-limit/network errors get a predictable backoff before
      // surfacing to the orchestrator's own retry loop.
      maxRetries: 3,
      timeout: 120_000,
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

    const meetingTypeConfig = agency?.meetingTypes?.find(
      (mt) => mt.type === transcript.meetingType,
    )?.promptConfig;

    const agencySpecificRules =
      agency.rules.map((r) => `- ${r}`).join("\n") +
      buildMeetingTypeExtractionContext(meetingTypeConfig);

    const extractionAliasBullets = this.createAliasPromptRules(agency, person);
    let aliasRules = "";
    if (extractionAliasBullets !== null) {
      aliasRules =
        dedent`#### ALIASES\n Below are aliases that have been defined for this agency. Use them in place of their default terms when they come up in action item content. Do not alter the assignee field, just the content of the item itself.` +
        extractionAliasBullets;
    }

    const userMessage = PROMPTS.EXTRACTION.USER({
      agencySpecificRules,
      transcript: transcript.rawText,
    });

    try {
      const extractionSystemPrompt = PROMPTS.EXTRACTION.SYSTEM({
        aliasRules,
      });
      const extracted = await completeChatWithZodSchema({
        client: this.openai,
        schema: ExtractionOutputSchema,
        messages: [
          {
            role: "system",
            content: extractionSystemPrompt,
          },
          { role: "user", content: userMessage },
        ],
      });

      agentLogger.info("Extraction agent completed", {
        action_items_count: extracted.actionItems.length,
        entities_count: extracted.entities.length,
      });

      return extracted;
    } catch (e) {
      agentLogger.error("Extraction agent failed", {
        err: e instanceof Error ? e : String(e),
      });
      throw e;
    }
  }

  /**
   * STEP 2: Writer Agent
   * Synthesizes case notes, minutes, and coaching staff feedback using
   * extracted facts and the transcript.
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
      outputs_count: agency.outputs.length,
      action_items_count: facts.actionItems.length,
      config_version: generateConfigKey(agency),
    });

    const glossaryStr = Object.entries(agency.glossary)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const entityDict = facts.entities.reduce(
      (acc, e) => ({ ...acc, [e.value]: e.entityKind }),
      {},
    );
    const factsStr = dedent`ACTIONS: ${facts.actionItems.length} found
      ENTITIES: ${JSON.stringify(entityDict)}`;
    const clientContextStr = `Client: ${normalizeNameCasing(
      `${person.givenNames} ${person.surname}`,
    )}`;

    const meetingTypeConfig = agency?.meetingTypes?.find(
      (mt) => mt.type === transcript.meetingType,
    )?.promptConfig;
    const meetingTypeCaseNoteGuidance =
      buildMeetingTypeCaseNoteGuidance(meetingTypeConfig);

    let structureStr = "";
    for (const output of agency.outputs) {
      let promptGuidance = output.promptGuidance;
      if (output.id === "case_note") {
        promptGuidance += meetingTypeCaseNoteGuidance;

        if (output.subheaders?.length) {
          promptGuidance += dedent`\nUse these subheaders where relevant:
        ${output.subheaders.join(", ")}. Omit any that don't apply,
        and add others if they'd better organize the content.`;
        }
      }

      structureStr += `- (${output.label}): ${promptGuidance}\n`;
    }

    const aliasPromptRules = this.createAliasPromptRules(agency, person);
    if (aliasPromptRules !== null) {
      structureStr +=
        dedent`#### ALIASES\n Below are aliases that have been defined for this agency. Use them in place of their default terms.` +
        aliasPromptRules;
    }

    structureStr = dedent(structureStr);

    const additionalOutputsSection = buildAdditionalOutputsSection(agency);

    const userMessage = PROMPTS.WRITER.USER({
      transcript: transcript.rawText,
      extracted: factsStr,
      glossary: glossaryStr,
      client: clientContextStr,
      structure: structureStr,
      poNotes: transcript.poNotes,
    });

    try {
      const result = await completeChatWithZodSchema({
        client: this.openai,
        schema: buildDraftingOutputSchema(agency),
        messages: [
          {
            role: "system",
            content: PROMPTS.WRITER.SYSTEM({ additionalOutputsSection }),
          },
          { role: "user", content: userMessage },
        ],
      });
      // Additional outputs aren't stored separately, so fold each one onto
      // caseNote so it shows up wherever caseNote already renders.
      let caseNote = result.caseNote;
      for (const output of agency.additionalOutputs) {
        const content = result[output.id].trim();
        if (content) {
          caseNote += `\n\n${output.label.toUpperCase()}:\n${content}`;
        }
      }

      agentLogger.info("Drafting agent completed", {
        case_note_length: caseNote.length,
        additional_outputs_count: agency.additionalOutputs.length,
        what_you_did_well_count: result.staffFeedback.whatYouDidWell.length,
        growth_opportunities_count:
          result.staffFeedback.growthOpportunities.length,
      });

      return { caseNote, staffFeedback: result.staffFeedback };
    } catch (e) {
      agentLogger.error("Drafting agent failed", {
        err: e instanceof Error ? e : String(e),
      });
      throw e;
    }
  }

  /**
   * Creates a bulleted list of rules regarding alias config to feed to our LLM
   * @param agency The agency config for this iteration
   * @param person The person we're running this iteration against
   * @returns A string containing a bulleted list of alias rules
   */
  private createAliasPromptRules(
    agency: AgencyConfig,
    person: Person,
  ): string | null {
    const aliasRules: string[] = [];

    if (isResident(person)) {
      const residentAlias = agency.aliases?.resident ?? "Resident";
      // A weird case, but basically if someone specifically wants residents to be referred to as "Clients",
      // that's ACTUALLY our default prompting behavior, and we shouldn't add a bullet for this.
      if (residentAlias !== "Client") {
        // This says "Client", intentionally, because the prompt doesn't delineate between resident/client
        aliasRules.push(
          `Use "${residentAlias}" instead of "Client" when referring to the client.`,
        );
      }
    } else if (agency.aliases?.client && agency.aliases.client !== "Client") {
      aliasRules.push(
        `Use "${agency.aliases.client}" instead of "Client" when referring to the client.`,
      );
    }

    if (
      agency.aliases?.staffMember &&
      agency.aliases.staffMember !== "Staff Member"
    ) {
      aliasRules.push(
        `Use "${agency.aliases.staffMember}" instead of "Staff Member" when referring to the staff member.`,
      );
    }

    if (
      agency.aliases?.thirdParty &&
      agency.aliases.thirdParty !== "Third Party"
    ) {
      aliasRules.push(
        `Use "${agency.aliases.thirdParty}" instead of "Third Party" when referring to a third party.`,
      );
    }

    if (aliasRules.length === 0) {
      return null;
    }

    return aliasRules.map((rule) => `\n- ${rule}`).join("");
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
      claims_to_verify: facts.actionItems.length,
    });

    if (facts.actionItems.length === 0) {
      agentLogger.info("Verification agent skipped - no claims to verify");
      return facts;
    }

    // Prepare claims
    const claimsList: string[] = [];
    facts.actionItems.forEach((item, i) => {
      claimsList.push(`ID: ACT_${i} | Task: ${item.task}`);
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
        parts: userMessage,
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
          item.evidenceQuotes = audit.evidenceQuotes;
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
