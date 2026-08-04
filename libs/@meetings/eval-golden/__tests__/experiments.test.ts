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

import { describe, expect, test, vi } from "vitest";

import type {
  DatasetExample,
  ExperimentConfig,
  GateVote,
} from "~@meetings/eval-golden/experiments";
import {
  aggregateVerdicts,
  compareActionItemCounts,
  selectExamples,
  SUITES,
  validateDatasets,
  withErrorRetries,
} from "~@meetings/eval-golden/experiments";
import type { TruthActionItem } from "~@meetings/eval-golden/types";
import { KNOWN_FLAKY_FILES } from "~@meetings/eval-golden/types";

// Deterministic stand-in for the real gpt-4.1 judge: matches action items by
// exact (assignee, task) equality so evaluator tests run with no API calls.
// Empty-vs-empty scores 1 (nothing predicted, nothing missed), matching
// precisionRecallF1's convention.
vi.mock("~@meetings/eval-golden/llm-judge", () => {
  const key = (i: TruthActionItem) => `${i.assignee}|${i.task}`;
  return {
    scoreActionItemsWithJudge: vi.fn(
      async (
        predicted: { actionItems: TruthActionItem[] },
        truth: { actionItems: TruthActionItem[] },
      ) => {
        const truthKeys = truth.actionItems.map(key);
        const matched = new Set<number>();
        for (const pk of predicted.actionItems.map(key)) {
          const idx = truthKeys.findIndex(
            (tk, i) => tk === pk && !matched.has(i),
          );
          if (idx >= 0) matched.add(idx);
        }
        const tp = matched.size;
        const fp = predicted.actionItems.length - tp;
        const fn = truth.actionItems.length - tp;
        const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
        const recall = tp + fn > 0 ? tp / (tp + fn) : 1;
        const f1 =
          precision + recall > 0
            ? (2 * precision * recall) / (precision + recall)
            : 0;
        return { precision, recall, f1, tp, fp, fn };
      },
    ),
  };
});

const cfg = (overrides?: Partial<ExperimentConfig>): ExperimentConfig => ({
  runs: 1,
  errorRetries: 0,
  includeFlaky: false,
  concurrency: 1,
  ...overrides,
});

const TRUTH = {
  actionItems: [{ assignee: "Client", task: "Attend makeup UA." }],
  entities: [],
};

const item = (assignee: string, task = "t"): TruthActionItem => ({
  assignee,
  task,
});

function extractionExample(
  label: string, // `<character>_ep<episode>`
  bucket: string,
  outputs: Record<string, unknown> = TRUTH,
): DatasetExample {
  const [character, episode] = label.split("_ep");
  return {
    id: `id-${label}`,
    inputs: { transcript: `script ${label}` },
    outputs,
    metadata: { character, episode, bucket },
  };
}

function biasExample(
  pairId: string,
  canonicalTruth: Record<string, unknown> | null = TRUTH,
): DatasetExample {
  return {
    id: `id-${pairId}`,
    inputs: { transcriptA: "A", transcriptB: "B" },
    outputs: { canonicalTruth },
    metadata: { pairId, scenarioLabel: "scenario" },
  };
}

describe("selectExamples", () => {
  const examples = [
    extractionExample("b_ep1", "NullTrap"),
    extractionExample("a_ep1", "IdealControl"),
    extractionExample([...KNOWN_FLAKY_FILES][0], "IdealControl"),
  ];
  const select = (config: ExperimentConfig) =>
    selectExamples(examples, config, SUITES.extraction).map((e) =>
      SUITES.extraction.label(e),
    );

  test("skips known-flaky labels and sorts", () => {
    expect(select(cfg())).toEqual(["a_ep1", "b_ep1"]);
  });

  test("EVAL_INCLUDE_FLAKY brings flaky labels back", () => {
    expect(select(cfg({ includeFlaky: true }))).toHaveLength(3);
  });

  test("bucketPattern matches bucket or label", () => {
    expect(select(cfg({ bucketPattern: /NullTrap/ }))).toEqual(["b_ep1"]);
    expect(select(cfg({ bucketPattern: /a_ep1/ }))).toEqual(["a_ep1"]);
  });
});

describe("validateDatasets", () => {
  const validExtraction = [
    ...[...KNOWN_FLAKY_FILES].map((label) =>
      extractionExample(label, "IdealControl"),
    ),
    extractionExample("a_ep1", "NullTrap"),
  ];
  const validBias = [biasExample("bias_pair01"), biasExample("bias_pair02")];

  test("accepts a consistent dataset", () => {
    expect(() => validateDatasets(validExtraction, validBias)).not.toThrow();
  });

  test("rejects unknown buckets", () => {
    expect(() =>
      validateDatasets(
        [...validExtraction, extractionExample("x_ep1", "Nope")],
        validBias,
      ),
    ).toThrow(/Nope/);
  });

  test("rejects examples missing character/episode metadata", () => {
    const bare: DatasetExample = {
      id: "id-bare",
      inputs: {},
      outputs: TRUTH,
      metadata: { bucket: "NullTrap" },
    };
    expect(() =>
      validateDatasets([...validExtraction, bare], validBias),
    ).toThrow(/character\/episode/);
  });

  test("rejects stale known-flaky entries", () => {
    expect(() =>
      validateDatasets([extractionExample("a_ep1", "NullTrap")], validBias),
    ).toThrow(/KNOWN_FLAKY/);
  });
});

describe("extraction evaluator", () => {
  const evaluator = SUITES.extraction.evaluator(cfg());

  test("passing prediction emits pass and score components", async () => {
    const results = await evaluator({
      outputs: { actionItems: TRUTH.actionItems, entities: [] },
      example: extractionExample("a_ep1", "IdealControl"),
    });
    const byKey = Object.fromEntries(results.map((r) => [r.key, r.score]));
    expect(byKey["pass"]).toBe(true);
    expect(byKey["action_items_f1"]).toBe(1);
    expect(byKey["action_items_precision"]).toBe(1);
    expect(byKey["action_items_recall"]).toBe(1);
  });

  test("hallucinated items fail a zero-FP bucket", async () => {
    const results = await evaluator({
      outputs: {
        actionItems: [{ assignee: "Client", task: "Invented task" }],
        entities: [],
      },
      example: extractionExample("a_ep1", "NullTrap", {
        ...TRUTH,
        actionItems: [],
      }),
    });
    expect(results.find((r) => r.key === "pass")?.score).toBe(false);
  });

  test("missing extraction output fails with a comment", async () => {
    const results = await evaluator({
      outputs: {},
      example: extractionExample("a_ep1", "IdealControl"),
    });
    expect(results).toEqual([
      { key: "pass", score: false, comment: "extraction produced no output" },
    ]);
  });
});

describe("compareActionItemCounts", () => {
  test("reports the delta for each differing assignee", () => {
    expect(
      compareActionItemCounts(
        [item("Client"), item("Client"), item("Staff Member")],
        [item("Client")],
      ),
    ).toEqual([
      { assignee: "Client", variantA: 2, variantB: 1, delta: -1 },
      { assignee: "Staff Member", variantA: 1, variantB: 0, delta: -1 },
    ]);
  });

  test("returns empty when counts match", () => {
    const items = [item("Client"), item("Staff Member")];
    expect(compareActionItemCounts(items, items)).toEqual([]);
  });

  test("counts assignees present only in variant B", () => {
    expect(compareActionItemCounts([], [item("Client")])).toEqual([
      { assignee: "Client", variantA: 0, variantB: 1, delta: 1 },
    ]);
  });
});

describe("bias evaluator", () => {
  const evaluator = SUITES.bias.evaluator(cfg());
  const matchingPrediction = { actionItems: TRUTH.actionItems, entities: [] };

  test("equal variants pass parity", async () => {
    const results = await evaluator({
      outputs: {
        predictedA: matchingPrediction,
        predictedB: matchingPrediction,
      },
      example: biasExample("bias_pair01"),
    });
    const byKey = Object.fromEntries(results.map((r) => [r.key, r.score]));
    expect(byKey["ai_f1_gap"]).toBe(0);
    expect(byKey["parity_pass"]).toBe(true);
  });

  test("a large F1 gap fails parity", async () => {
    const results = await evaluator({
      outputs: {
        predictedA: matchingPrediction,
        predictedB: { actionItems: [], entities: [] },
      },
      example: biasExample("bias_pair01"),
    });
    expect(results.find((r) => r.key === "parity_pass")?.score).toBe(false);
  });

  test("missing canonical truth is inconclusive", async () => {
    const results = await evaluator({
      outputs: {
        predictedA: matchingPrediction,
        predictedB: matchingPrediction,
      },
      example: biasExample("bias_pair01", null),
    });
    const parity = results.find((r) => r.key === "parity_pass");
    expect(parity?.score).toBeUndefined();
    expect(parity?.value).toBe("inconclusive");
  });
});

describe("aggregateVerdicts", () => {
  const vote = (
    exampleId: string,
    pass: boolean | null,
    label = exampleId,
  ): GateVote => ({ exampleId, label, group: "g", pass });

  test("strict majority across repetitions", () => {
    const verdicts = aggregateVerdicts([
      vote("a", true),
      vote("a", true),
      vote("a", false),
      vote("b", true),
      vote("b", false),
    ]);
    expect(verdicts.find((v) => v.label === "a")?.passed).toBe(true);
    // 1/2 is not a strict majority.
    expect(verdicts.find((v) => v.label === "b")?.passed).toBe(false);
  });

  test("inconclusive-only examples pass the gate but are flagged", () => {
    const [verdict] = aggregateVerdicts([vote("a", null)]);
    expect(verdict.passed).toBe(true);
    expect(verdict.inconclusive).toBe(true);
  });

  test("missing gate results count as failures", () => {
    const [verdict] = aggregateVerdicts([vote("a", false), vote("a", null)]);
    expect(verdict.passed).toBe(false);
    expect(verdict.votes).toBe(1);
  });
});

describe("withErrorRetries", () => {
  test("returns the first success without extra attempts", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withErrorRetries(fn, 2, "t")).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("retries <= 0 means a single attempt", async () => {
    for (const retries of [0, -3]) {
      const fn = vi.fn().mockRejectedValue(new Error("boom"));
      // eslint-disable-next-line no-await-in-loop
      await expect(withErrorRetries(fn, retries, "t")).rejects.toThrow("boom");
      expect(fn).toHaveBeenCalledTimes(1);
    }
  });

  test("retries a thrown failure and returns the eventual success", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValue("ok");
    await expect(withErrorRetries(fn, 2, "t")).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test("rethrows the last error once attempts are exhausted", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("first"))
      .mockRejectedValue(new Error("last"));
    await expect(withErrorRetries(fn, 1, "t")).rejects.toThrow("last");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
