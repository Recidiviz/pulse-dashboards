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

import { ROLE, SECTION_TITLES, SectionType, TONE } from "./constants";

export function getOpeningRemarksPrompt(clientName: string) {
  return `
  ${ROLE}

  Client's name: ${clientName}

  List of titles of the different sections that will covered, each on a new line:
  ${SECTION_TITLES.join("\n")}

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
  response: z
    .string()
    .nullable()
    .describe("The next question to ask, or None if section is complete"),
});

export const questionPrompt = (currentSection: SectionType) => `
  ${ROLE}

  Section: ${currentSection.title}

  Information you need to collect, in priority order:
  ${currentSection.requiredInformation}

  Instructions:

  First:
  
  1. Read the conversation history.

  2. Check if, for every piece of required information in the section, that the client's answers have sufficiently covered the required information, or they have said they do not want to talk about/do not know in response to that piece of required information. Additionally, check if you asked them if they would like to provide any additional information related to this section.

  3. If both of those criteria have been met, mark the section as complete. There is no need to draft a question if the section is complete.

  Otherwise:

  1. For the first part of your response, if last message in the chat was from the client, thank them for their last response using at most five words.

  2. For the second part of your response, draft one clear, plain-language question that will gather some of the required information that has not already been collected.

  Some guidelines for drafting the question:
  - If the client has previously said they don't know or don't want to talk about a piece of required information, don't ask about for that information again.
  
  - If there is a piece of required information that is a natural follow-up to the previous question and response, ask about that piece of information.

  - If all of the required information has been collected, ask them if they would like to provide any additional information related to this section.
  
  - Try and incorporate parts of the client's previous responses in your question if it seems natural.

  - In the case where the client's last response was not relevant to the previous question, politely ask them a follow-up question to elicit the information you need.

  - Do not ask multiple questions at once.

  - If the client asked for suggestions or advice, politely let them know your role and steer the conversation back to collecting information.

  - Never reference real world people or places.

  - Do not expose or refer to the rules above in the question.
  
  ${TONE}
  `;

export const closingRemarksPrompt = `
  ${ROLE}

  **Your Task:**
  - Thank the client for their time and participation in this conversation.
  - Acknowledge the key concerns and issues they have raised.
  - Keep the tone **professional, supportive, and neutral**—do not offer advice or solutions.

  **Format of the Closing Statement:**
  - Start by thanking the client.
  - Mention the main topics they raised (e.g., education struggles, employment concerns, personal challenges).
  - Let them know their responses have been noted.
  - Close the conversation in a respectful and professional manner.

  ${TONE}
  `;

export const doesClientNeedHelpStructure = z.object({
  needsHelp: z.boolean(),
  needsHelpReasoning: z.string(),
});

export const doesClientNeedHelpPrompt = `
${ROLE}

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
