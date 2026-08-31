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

import dedent from "dedent";

import type {
  AgencyConfig,
  MeetingTypeConfigEntry,
} from "~@meetings/config/types";
import { isResident, type Person } from "~@meetings/prisma/types";
import type { TranscriptInput } from "~@meetings/tasks/llm/schemas";
import { normalizeNameCasing } from "~@meetings/tasks/llm/utils";

export interface WriterUserVariables {
  transcript: string;
  extracted: string;
  glossary: string;
  structure: string;
  client: string;
  poNotes: string;
}

export interface WriterFacts {
  actionItems: unknown[];
  entities: Array<{ value: string; entityKind: string }>;
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
 * Creates a bulleted list of rules regarding alias config to feed to our LLM
 * @param agency The agency config for this iteration
 * @param person The person we're running this iteration against
 * @returns A string containing a bulleted list of alias rules
 */
export function createAliasPromptRules(
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

export function buildWriterUserVariables(
  transcript: TranscriptInput,
  facts: WriterFacts,
  agency: AgencyConfig,
  person: Person,
): WriterUserVariables {
  const glossary = Object.entries(agency.glossary)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const entityDict = facts.entities.reduce(
    (acc, e) => ({ ...acc, [e.value]: e.entityKind }),
    {},
  );
  const extracted = dedent`ACTIONS: ${facts.actionItems.length} found
    ENTITIES: ${JSON.stringify(entityDict)}`;

  const client = `Client: ${normalizeNameCasing(
    `${person.givenNames} ${person.surname}`,
  )}`;

  const meetingTypeConfig = agency?.meetingTypes?.find(
    (mt) => mt.type === transcript.meetingType,
  )?.promptConfig;
  const meetingTypeCaseNoteGuidance =
    buildMeetingTypeCaseNoteGuidance(meetingTypeConfig);

  let structure = "";
  for (const output of agency.outputs) {
    let promptGuidance = output.promptGuidance;
    if (output.id === "case_note") {
      promptGuidance += meetingTypeCaseNoteGuidance;
    }
    if (output.subheaders?.length) {
      promptGuidance += dedent`\nUse these subheaders where relevant:
      ${output.subheaders.join(", ")}. Omit any that don't apply,
      and add others if they'd better organize the content.`;
    }

    structure += `- (${output.label}): ${promptGuidance}\n`;
  }

  const aliasPromptRules = createAliasPromptRules(agency, person);
  if (aliasPromptRules !== null) {
    structure +=
      dedent`#### ALIASES\n Below are aliases that have been defined for this agency. Use them in place of their default terms.` +
      aliasPromptRules;
  }

  structure = dedent(structure);

  return {
    transcript: transcript.rawText,
    extracted,
    glossary,
    structure,
    client,
    poNotes: transcript.poNotes,
  };
}
