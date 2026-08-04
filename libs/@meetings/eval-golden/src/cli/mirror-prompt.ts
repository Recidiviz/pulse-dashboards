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
 * One-way git -> LangSmith mirror of the extraction prompt, so the committed
 * prompt is available in the LangSmith Playground to fork from. Non-engineers
 * iterate on forks against the meetings-eval-golden dataset (whose example
 * inputs carry the prompt's template variables); winning text comes back as a
 * PR to prompts.ts. Never edit the mirrored prompt in LangSmith directly.
 *
 *   nx run @meetings/eval-golden:mirror-prompt
 *
 * Run after changing the extraction prompt (CI runs it on merges to main).
 */

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Client } from "langsmith";

import { PROMPTS } from "~@meetings/tasks/llm/prompts";

export const MIRRORED_PROMPT_NAME = "meetings-extraction";

/**
 * The extraction prompt as a chat prompt. The system message is static; the
 * user message keeps `transcript` / `agencySpecificRules` as mustache
 * variables matching the dataset example inputs, by passing the literal
 * placeholders through the committed lodash template.
 */
export const extractionPromptTemplate = () =>
  ChatPromptTemplate.fromMessages(
    [
      ["system", PROMPTS.EXTRACTION.SYSTEM({})],
      [
        "human",
        PROMPTS.EXTRACTION.USER({
          transcript: "{{transcript}}",
          agencySpecificRules: "{{agencySpecificRules}}",
        }),
      ],
    ],
    { templateFormat: "mustache" },
  );

async function main(): Promise<void> {
  const apiKey =
    process.env["LANGSMITH_API_KEY"] ?? process.env["LANGCHAIN_API_KEY"];
  if (!apiKey) {
    throw new Error(
      "LANGSMITH_API_KEY / LANGCHAIN_API_KEY is not set. Run via " +
        "`nx run @meetings/eval-golden:mirror-prompt` so the sops env loads.",
    );
  }
  const url = await new Client({ apiKey }).pushPrompt(MIRRORED_PROMPT_NAME, {
    object: extractionPromptTemplate(),
    description:
      "Mirror of the committed Meetings extraction prompt " +
      "(libs/@meetings/tasks/src/llm/prompts.ts). One-way git -> LangSmith: " +
      "fork it in the Playground to iterate; do not edit this prompt directly.",
  });
  console.log(`Mirrored extraction prompt: ${url}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
