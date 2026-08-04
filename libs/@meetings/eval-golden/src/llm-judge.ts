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
 * LLM-as-judge semantic matcher for action items: one gpt-4.1 call per
 * example, sending truth + predicted + (optionally) acceptable items and
 * asking for {truthIndex, predictedIndex} match pairs, which are validated and
 * turned into precision/recall/F1.
 *
 * Action items only: every bucket's PASS_CRITERIA and the bias gate read
 * action-item scores alone, so judging the other extraction fields would cost
 * calls no gate consumes.
 */

import { wrapOpenAI } from "langsmith/wrappers";
import OpenAI from "openai";
import { z } from "zod";

import { JUDGE_PROMPTS } from "~@meetings/eval-golden/prompts";
import type {
  ActionItemScores,
  PredictedExtraction,
  TruthActionItem,
  TruthFile,
} from "~@meetings/eval-golden/types";
import { zodToOpenAIStructuredOutputSchema } from "~@meetings/tasks/llm/clients/openai";

const JUDGE_MODEL = "gpt-4.1";

const matchResultSchema = z.object({
  matches: z.array(
    z.object({
      truthIndex: z.number().int(),
      predictedIndex: z.number().int(),
    }),
  ),
  acceptableMatches: z.array(z.number().int()),
});

type MatchResult = z.infer<typeof matchResultSchema>;

const EMPTY_RESULT: MatchResult = { matches: [], acceptableMatches: [] };

function buildClient(): OpenAI {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY not set — required for the LLM judge. " +
        "Run via `nx run @meetings/eval-golden:regression` so the SOPS env override loads it.",
    );
  }
  // Traced so judge (gpt-4.1) spend is attributed in LangSmith, not invisible.
  return wrapOpenAI(
    new OpenAI({ apiKey: key, baseURL: "https://us.api.openai.com/v1" }),
  );
}

async function callJudge(client: OpenAI, prompt: string): Promise<MatchResult> {
  // The repo's existing helper is GPT-5-only by default. We need GPT-4.1
  // here, so we call the API directly but reuse the schema converter.
  const response = await client.chat.completions.create({
    model: JUDGE_MODEL,
    messages: [
      { role: "system", content: JUDGE_PROMPTS.ACTION_ITEMS.SYSTEM },
      { role: "user", content: prompt },
    ],
    response_format: zodToOpenAIStructuredOutputSchema(matchResultSchema, {
      strict: true,
      name: "match_result",
    }),
    temperature: 0,
    max_tokens: 2048,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("LLM judge returned empty content");
  return matchResultSchema.parse(JSON.parse(content));
}

/**
 * True when the outcome is fully determined without semantic judgment:
 * nothing was predicted (every truth item is a miss), or there is nothing to
 * compare predictions against (no truth and no acceptable list — every
 * prediction is a false positive). Empty truth *with* an acceptable list still
 * goes to the judge, which decides which predictions it excuses.
 */
export function isTrivial(
  truthCount: number,
  predictedCount: number,
  acceptableCount: number,
): boolean {
  return predictedCount === 0 || (truthCount === 0 && acceptableCount === 0);
}

/**
 * Validate the judge's raw match pairs and count outcomes. Out-of-range
 * indices and duplicate pairs are dropped; action items match many-to-many, so
 * tp is the number of distinct truth items matched.
 */
export function deriveCounts(
  truthCount: number,
  predictedCount: number,
  result: MatchResult,
): { tp: number; fp: number; fn: number } {
  const matchedTruth = new Set<number>();
  const matchedPredicted = new Set<number>();
  for (const { truthIndex, predictedIndex } of result.matches) {
    if (truthIndex < 0 || truthIndex >= truthCount) continue;
    if (predictedIndex < 0 || predictedIndex >= predictedCount) continue;
    matchedTruth.add(truthIndex);
    matchedPredicted.add(predictedIndex);
  }
  // A predicted item that already matched truth doesn't need excusing; the
  // acceptable list only absorbs would-be false positives.
  const excused = new Set(
    result.acceptableMatches.filter(
      (pi) => pi >= 0 && pi < predictedCount && !matchedPredicted.has(pi),
    ),
  );
  return {
    tp: matchedTruth.size,
    fp: predictedCount - matchedPredicted.size - excused.size,
    fn: truthCount - matchedTruth.size,
  };
}

const round4 = (n: number): number => Math.round(n * 10000) / 10000;

/**
 * Degenerate cases score 1, not 0: with no predictions there are no wrong
 * predictions (precision), and with no truth there is nothing to miss
 * (recall) — so an empty prediction against an empty truth is a perfect run.
 */
export function precisionRecallF1(
  tp: number,
  fp: number,
  fn: number,
): { precision: number; recall: number; f1: number } {
  const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 1;
  const f1 =
    precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;
  return {
    precision: round4(precision),
    recall: round4(recall),
    f1: round4(f1),
  };
}

const numbered = (prefix: string, items: TruthActionItem[]): string =>
  items.length === 0
    ? "(none)"
    : items
        .map(
          (i, idx) => `${prefix}${idx}: [${i.assignee || "?"}] ${i.task ?? ""}`,
        )
        .join("\n");

export async function scoreActionItemsWithJudge(
  predicted: PredictedExtraction,
  truth: TruthFile,
  client: OpenAI = buildClient(),
): Promise<ActionItemScores> {
  const predictedItems = predicted.actionItems;
  const truthItems = truth.actionItems;
  const acceptable = truth.acceptableActionItems ?? [];

  const result = isTrivial(
    truthItems.length,
    predictedItems.length,
    acceptable.length,
  )
    ? EMPTY_RESULT
    : await callJudge(
        client,
        JUDGE_PROMPTS.ACTION_ITEMS.USER({
          truthLines: numbered("T", truthItems),
          predictedLines: numbered("P", predictedItems),
          acceptableLines:
            acceptable.length > 0 ? numbered("A", acceptable) : undefined,
        }),
      );

  const counts = deriveCounts(truthItems.length, predictedItems.length, result);
  return { ...precisionRecallF1(counts.tp, counts.fp, counts.fn), ...counts };
}
