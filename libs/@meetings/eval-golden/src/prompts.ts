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
 * Prompt for the LLM judge (src/llm-judge.ts). Same layout as the live
 * pipeline's prompts.ts and the automated eval pipeline's evaluators.
 *
 * The user prompt takes pre-formatted item lines (`T0: …` / `P0: …` / `A0: …`,
 * one per line) and returns `matches` as {truthIndex, predictedIndex} objects
 * plus `acceptableMatches` (predicted indices).
 */

import dedent from "dedent";

interface MatchPromptInputs {
  /** One `T<i>: …` line per ground-truth item; "(none)" when empty. */
  truthLines: string;
  /** One `P<i>: …` line per predicted item. */
  predictedLines: string;
  /** One `A<i>: …` line per acceptable item; omit when there are none. */
  acceptableLines?: string;
}

function acceptableBlock(acceptableLines: string | undefined): string {
  if (!acceptableLines) return "";
  return dedent`
    ACCEPTABLE items (valid extractions that are not required but should not be penalized):
    ${acceptableLines}

    Check unmatched predicted items against the ACCEPTABLE list, applying the same generous matching standard. If a predicted item matches an acceptable item, include its index in "acceptableMatches" so it is not penalized as a false positive. When there are no ground truth items at all, every predicted item should either match an ACCEPTABLE item or be left unmatched.
  `;
}

export const JUDGE_PROMPTS = {
  ACTION_ITEMS: {
    SYSTEM:
      "You are a generous semantic matching judge. Match items if they refer to the same real-world fact, task, or situation — even if phrased very differently.",
    USER: ({
      truthLines,
      predictedLines,
      acceptableLines,
    }: MatchPromptInputs) =>
      dedent`
        You are evaluating an AI extraction pipeline. Compare predicted action items against ground truth action items from a parole/probation supervision meeting transcript.

        GROUND TRUTH action items:
        ${truthLines}

        PREDICTED action items:
        ${predictedLines}

        For each ground truth item, find the predicted item (if any) that captures the SAME underlying task or obligation. Be GENEROUS with matching — you are checking whether the pipeline captured the right information, not whether it used the same words.

        Matching guidelines:
        1. Assignee agreement (PO/Officer/Staff Member all mean the same staff role) supports a match, but never reject a match on assignee alone: if a truth item says [Client] and a predicted says [PO] but the core task is the same, still match them — assignee labels are often ambiguous.
        2. Flexible phrasing: "Bring updated paystubs" = "Provide recent pay stubs at next visit" = "Submit paystub documentation". The core obligation is the same.
        3. Specificity differences are fine: "Notify the PO if anything changes" matches "Call or message the PO through the portal if the real estate board responds". More specific or more general versions of the same task both count.
        4. Bundled vs split: Works BOTH directions.
           - Truth bundles, pipeline splits: truth "bring paystubs, receipt, and logs" matches 3 separate predicted items → multiple predicted match one truth.
           - Pipeline bundles, truth splits: predicted "Bring paystubs and community service logs to the appointment" matches BOTH truth "Bring updated paystubs" AND truth "Bring community service logs" → one predicted matches multiple truth items.
           In both cases, match based on the SUBSTANTIVE tasks mentioned, not incidental context like "to the appointment".
        5. Deadline differences do NOT prevent a match. "Bring paystubs (by the 14th)" matches "Bring paystubs to next appointment".
        6. Focus on the PRIMARY action, not incidental context. "Bring paystubs to the appointment" is about bringing paystubs, not about attending the appointment. Don't match it to "Attend the next appointment" when a better match exists.
        7. When in doubt, MATCH. The goal is to detect whether the pipeline captured the same real-world action, not to penalize rephrasing.
        8. Prefer the BEST match: when a predicted item describes a single task that could plausibly match several truth items, pair it only with the truth item whose core task is most similar. A predicted item matches multiple truth items only when it genuinely bundles several distinct tasks (guideline 4).

        A truth item CAN match multiple predicted items, and a predicted item CAN match multiple truth items — but only in the bundling situations described in guidelines 4 and 8.

        ${acceptableBlock(acceptableLines)}
        Output a JSON object with:
        - "matches": array of {"truthIndex": number, "predictedIndex": number} objects
        - "acceptableMatches": array of predicted indices that match an ACCEPTABLE item (empty array if there is no ACCEPTABLE list or nothing matches it)

        Example: {"matches": [{"truthIndex": 0, "predictedIndex": 2}, {"truthIndex": 0, "predictedIndex": 5}, {"truthIndex": 1, "predictedIndex": 0}], "acceptableMatches": [3, 7]}`,
  },
};
