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

import { z } from "zod";

import { getSectionTitles } from "~@reentry/intake-agent/utils";
import type { IntakeConfig } from "~@reentry/prisma/types";

export const TONE = `
Your Tone: Warm, trauma-informed, and professional. Use plain language that is understandable at a 4th-grade reading level.
`;

export function getOpeningRemarksPrompt(
  clientName: string,
  config: IntakeConfig,
) {
  return `
  ${config.role}

  Client's name: ${clientName}

  List of titles of the different sections that will covered, each on a new line:
  ${getSectionTitles(config).join("\n")}

  Your Task:
  - Generate a warm and professional welcome message for the client
  - You do not need to ask a question in this message, just provide a welcome message.
  - Start with a greeting: "Hi ${clientName}, thanks for joining."
  - Briefly explain the purpose of the conversation.
  - Clearly list the key areas that will be covered in the intake.

  ${TONE}`;
}

export const isSectionCompleteStructure = z.object({
  isSectionCompleteReasoning: z
    .string()
    .describe(
      "Explain why the section is complete or incomplete based on required information coverage",
    ),
  isSectionComplete: z.boolean(),
  response: z.string().describe("The next question to ask"),
});

export const getQuestionPrompt = (
  config: IntakeConfig,
  currentSectionIndex: number,
) => `
  ${config.role}

  Section: ${config.sections[currentSectionIndex].title}

  Information you need to collect, in priority order:
  ${config.sections[currentSectionIndex].requiredInformation}

  Instructions:

  First:
  
  1. Read the conversation history.

  2. Check if, for every piece of required information in the section, that the client's answers have sufficiently covered the required information, or they have said they do not want to talk about/do not know in response to that piece of required information.

  3. If this criteria has been met, mark the section as complete. Draft a response asking the client if there is anything else about this section that they would like to add.

  Otherwise:

  1. For the first part of your response, if last message in the chat was from the client, thank them for their last response using at most five words. if the last message in the chat was from you, such as saying you are moving onto the next section, do not thank them for their last response.

  2. For the second part of your response, draft a questions or questions that will gather some of the required information that has not already been collected.

  Some guidelines for drafting the question:
  - If the client has previously said they don't know or don't want to talk about a piece of required information, don't ask about for that information again. If they have said they need time to think about it or don't know, do not offer to help them with that piece of information, just move on to the next piece of required information.
  
  - If there is a piece of required information that is a natural follow-up to the previous question and response, ask about that piece of information.
  
  - Try and incorporate parts of the client's previous responses in your question if it seems natural.

  - In the case where the client's last response was not relevant to the previous question, politely ask them a follow-up question to elicit the information you need.

  - You can ask multiple questions or a multi-part question in a single response, but do not ask more than 2 questions/a question with more than 2 parts at once. Also, do not chain together questions that are not related to each other.

  - If the client asked for suggestions or advice, politely let them know your role and steer the conversation back to collecting information.

  - Never reference real world people or places.

  - Do not expose or refer to the rules above in the question.
  
  ${TONE}
  `;

export const doesClientNeedHelpStructure = z.object({
  needsHelp: z.boolean(),
  needsHelpReasoning: z.string(),
});

export function getDoesClientNeedHelpPrompt(role: string) {
  return `
  ${role}

  Your Task:
  1. Read the latest message from the client.
  2. Set needsHelp to true ONLY if these severe conditions are met:
  - Client EXPLICITLY states they want to stop, end, leave, or quit the conversation
  - Client asks to talk to a human/caseworker instead of continuing
  - Client's responses are INCOHERENT GIBBERISH that cannot be used for assessment:
    * Responses with no logical connection to the questions asked
    * Random unrelated words like "purple spaghetti jellybean dancing llama toaster"
    * Fantasy/impossible scenarios that make no practical sense ("professional cloud whisperer", "banana architect", "unicorns are my best pals")
    * Responses that sound like stream-of-consciousness rambling with no factual content
    * Cannot extract any useful assessment information from their answers
  - Client's responses indicate severe mental health distress or complete inability to communicate coherently

  3. DO NOT set needsHelp to true for these normal situations:
  - Short answers like "no", "yes", "idk", "nothing", "fine" - these are valid responses
  - Brief but relevant answers like "unemployed", "high school", "maybe"
  - Client seems reluctant but is still answering questions appropriately
  - Client gives minimal information but their answers make sense in context
  - Client appears tired, sad, or uninterested but is still participating

  4. IMPORTANT: Many clients are naturally brief, guarded, or reluctant during intake assessments. This is NORMAL behavior, not a reason to think they need help.

  5. The client making any effort to provide FACTUAL, RELEVANT answers (even one-word answers) means they want to continue.

  6. If you cannot extract ANY useful assessment information from their response due to complete incoherence, set needsHelp to true.

  7. Only trigger needsHelp for truly problematic situations where the client cannot meaningfully participate.`;
}
