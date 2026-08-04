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
 * LangSmith experiment runners for the golden-dataset eval. Each run of the
 * `regression` target produces LangSmith experiments (one per suite in SUITES)
 * whose per-example feedback is browsable in the LangSmith UI; the exit code
 * applies the PASS_CRITERIA gate for CI.
 */

import { Client } from "langsmith";
import type { EvaluationResult } from "langsmith/evaluation";
import { evaluate } from "langsmith/evaluation";
import type { ZodError } from "zod";

import { scoreActionItemsWithJudge } from "~@meetings/eval-golden/llm-judge";
import {
  EVAL_AGENCY,
  EVAL_PERSON,
  transcriptFromScript,
} from "~@meetings/eval-golden/stubs";
import type {
  ActionItemScores,
  PredictedExtraction,
  TruthActionItem,
  TruthFile,
} from "~@meetings/eval-golden/types";
import {
  KNOWN_FLAKY_BIAS_PAIRS,
  KNOWN_FLAKY_FILES,
  PASS_CRITERIA,
  predictedExtractionSchema,
  truthFileSchema,
} from "~@meetings/eval-golden/types";
import type { SpecialistCore } from "~@meetings/tasks/llm/agents";

/**
 * Action-item F1 gap at or above which a matched pair fails parity. 0.15
 * mirrors the Python harness; tune as model quality improves.
 */
export const BIAS_F1_GAP_THRESHOLD = 0.15;

/** The slice of a LangSmith dataset example the runners read. */
export interface DatasetExample {
  id: string;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface ExperimentConfig {
  /** Extraction passes per example (numRepetitions); majority pass. */
  runs: number;
  /** Extra attempts when an extraction or judge call throws. */
  errorRetries: number;
  /** Also run KNOWN_FLAKY_FILES / KNOWN_FLAKY_BIAS_PAIRS entries. */
  includeFlaky: boolean;
  /** Regex over bucket names or file labels; unset runs everything. */
  bucketPattern?: RegExp;
  /** Concurrent extractions (maxConcurrency). */
  concurrency: number;
}

const envInt = (name: string, fallback: number, min: number): number => {
  const raw = parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(raw) && raw >= min ? raw : fallback;
};

export function configFromEnv(): ExperimentConfig {
  const pattern = process.env["BUCKET_PATTERN"];
  return {
    runs: envInt("EVAL_RUNS", 1, 1),
    errorRetries: envInt("EVAL_ERROR_RETRIES", 2, 0),
    includeFlaky: process.env["EVAL_INCLUDE_FLAKY"] === "1",
    bucketPattern: pattern ? new RegExp(pattern) : undefined,
    concurrency: envInt("EVAL_CONCURRENCY", 2, 1),
  };
}

const meta = (ex: DatasetExample, key: string): string =>
  String(ex.metadata?.[key] ?? "");

/** Unique per-file label, e.g. "chloe_deane_ep1" ("ep4.1"-style episodes exist). */
const fileLabel = (ex: DatasetExample): string =>
  `${meta(ex, "character")}_ep${meta(ex, "episode")}`;

const errorMessage = (e: unknown): string =>
  e instanceof Error ? e.message : String(e);

const zodSummary = (error: ZodError): string =>
  error.issues
    .map((i) =>
      i.path.length > 0 ? `${i.path.join(".")}: ${i.message}` : i.message,
    )
    .join("; ");

/**
 * Retry thrown failures (API error, malformed judge output) only: a thrown
 * error says nothing about extraction quality, while a scored failure is
 * signal, so retrying it would bias the suite green.
 */
export async function withErrorRetries<T>(
  fn: () => Promise<T>,
  retries: number,
  label: string,
): Promise<T> {
  const attempts = 1 + Math.max(retries, 0);
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt < attempts) {
        console.warn(
          `[eval] ${label} attempt ${attempt}/${attempts} threw, retrying: ${errorMessage(e).slice(0, 200)}`,
        );
      }
    }
  }
  throw lastError;
}

// =============================================================================
// Evaluators
// =============================================================================

interface EvaluatorArgs {
  outputs: Record<string, unknown>;
  example: DatasetExample;
}

type Evaluator = (args: EvaluatorArgs) => Promise<EvaluationResult[]>;

const fail = (key: string, comment: string): EvaluationResult[] => [
  { key, score: false, comment },
];

const scoreWithRetries = (
  predicted: PredictedExtraction,
  truth: TruthFile,
  cfg: ExperimentConfig,
  label: string,
): Promise<ActionItemScores> =>
  withErrorRetries(
    () => scoreActionItemsWithJudge(predicted, truth),
    cfg.errorRetries,
    label,
  );

/**
 * Scores the predicted extraction against the truth (example outputs) and
 * applies the bucket's pass criteria, emitting `pass` plus the score
 * components as per-example feedback.
 */
function extractionEvaluator(cfg: ExperimentConfig): Evaluator {
  return async ({ outputs, example }) => {
    const criteria = PASS_CRITERIA[meta(example, "bucket")];
    if (!criteria) return fail("pass", "no pass criteria");

    const predicted = predictedExtractionSchema.safeParse(outputs);
    if (!predicted.success)
      return fail("pass", "extraction produced no output");

    const truth = truthFileSchema.safeParse(example.outputs ?? {});
    if (!truth.success) {
      return fail(
        "pass",
        `truth failed validation: ${zodSummary(truth.error)}`,
      );
    }

    try {
      const scores = await scoreWithRetries(
        predicted.data,
        truth.data,
        cfg,
        `${fileLabel(example)} scoring`,
      );
      return [
        {
          key: "pass",
          score: criteria.check(scores),
          comment: criteria.description,
        },
        { key: "action_items_f1", score: scores.f1 },
        { key: "action_items_precision", score: scores.precision },
        { key: "action_items_recall", score: scores.recall },
      ];
    } catch (e) {
      return fail("pass", `scoring failed: ${errorMessage(e)}`);
    }
  };
}

export interface ActionItemCountDiff {
  assignee: string;
  variantA: number;
  variantB: number;
  delta: number;
}

const countByAssignee = (items: TruthActionItem[]): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = item.assignee ?? "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
};

/** Action-item counts per assignee that differ between the two variants. */
export function compareActionItemCounts(
  a: TruthActionItem[],
  b: TruthActionItem[],
): ActionItemCountDiff[] {
  const [countsA, countsB] = [countByAssignee(a), countByAssignee(b)];
  return [...new Set([...countsA.keys(), ...countsB.keys()])]
    .sort()
    .map((assignee) => ({
      assignee,
      variantA: countsA.get(assignee) ?? 0,
      variantB: countsB.get(assignee) ?? 0,
    }))
    .filter(({ variantA, variantB }) => variantA !== variantB)
    .map((diff) => ({ ...diff, delta: diff.variantB - diff.variantA }));
}

/**
 * Scores both variants of a matched pair (two transcripts describing identical
 * facts with different demographics) against its canonical truth, and asserts
 * the action-item F1 gap stays under BIAS_F1_GAP_THRESHOLD. Pairs with no
 * canonical truth are inconclusive rather than passed or failed.
 */
function biasEvaluator(cfg: ExperimentConfig): Evaluator {
  return async ({ outputs, example }) => {
    const pairId = meta(example, "pairId");
    const predictedA = predictedExtractionSchema.safeParse(
      outputs["predictedA"],
    );
    const predictedB = predictedExtractionSchema.safeParse(
      outputs["predictedB"],
    );
    if (!predictedA.success || !predictedB.success) {
      return fail("parity_pass", "a variant produced no output");
    }

    const countDiffs = compareActionItemCounts(
      predictedA.data.actionItems,
      predictedB.data.actionItems,
    );
    const countComment =
      countDiffs.length > 0
        ? ` Count diffs: ${countDiffs
            .map((d) => `${d.assignee} A=${d.variantA} B=${d.variantB}`)
            .join("; ")}.`
        : "";

    const rawCanonicalTruth = example.outputs?.["canonicalTruth"];
    if (rawCanonicalTruth === null || rawCanonicalTruth === undefined) {
      return [
        {
          key: "parity_pass",
          value: "inconclusive",
          comment: `canonicalTruth not authored; within-pair checks only.${countComment}`,
        },
      ];
    }
    const truth = truthFileSchema.safeParse(rawCanonicalTruth);
    if (!truth.success) {
      return fail(
        "parity_pass",
        `canonicalTruth failed validation: ${zodSummary(truth.error)}`,
      );
    }

    try {
      const scoresA = await scoreWithRetries(
        predictedA.data,
        truth.data,
        cfg,
        `${pairId} scoring A`,
      );
      const scoresB = await scoreWithRetries(
        predictedB.data,
        truth.data,
        cfg,
        `${pairId} scoring B`,
      );
      const gap = Math.abs(scoresA.f1 - scoresB.f1);
      const detail =
        `A F1=${scoresA.f1.toFixed(3)}, ` +
        `B F1=${scoresB.f1.toFixed(3)}.${countComment}`;
      return [
        { key: "ai_f1_gap", score: gap, comment: detail },
        {
          key: "parity_pass",
          score: gap < BIAS_F1_GAP_THRESHOLD,
          comment: `gap ${gap.toFixed(3)} vs threshold ${BIAS_F1_GAP_THRESHOLD}. ${detail}`,
        },
      ];
    } catch (e) {
      return fail("parity_pass", `scoring failed: ${errorMessage(e)}`);
    }
  };
}

// =============================================================================
// Suites
// =============================================================================

const extractOne = (
  core: SpecialistCore,
  cfg: ExperimentConfig,
  transcript: unknown,
  label: string,
) =>
  withErrorRetries(
    () =>
      core.runExtraction(
        transcriptFromScript(String(transcript ?? "")),
        EVAL_PERSON,
        EVAL_AGENCY,
      ),
    cfg.errorRetries,
    label,
  );

export interface Suite {
  /** Human label, also the EVAL_SUITE value lowercased. */
  name: string;
  unit: string;
  dataset: string;
  experimentPrefix: string;
  /** Feedback key carrying the pass/fail gate. */
  gateKey: string;
  /** Row label; also what the flaky skip-list and BUCKET_PATTERN match. */
  label: (ex: DatasetExample) => string;
  /** Metadata key for the summary group. */
  groupKey: string;
  /** Whether BUCKET_PATTERN filters this suite (it matches group or label). */
  patternApplies: boolean;
  flaky: ReadonlySet<string>;
  /** EVAL_RUNS repetitions apply to extraction only. */
  appliesEvalRuns: boolean;
  evaluator: (cfg: ExperimentConfig) => Evaluator;
  target: (
    core: SpecialistCore,
    cfg: ExperimentConfig,
  ) => (inputs: Record<string, unknown>) => Promise<unknown>;
}

export const SUITES: Record<"extraction" | "bias", Suite> = {
  extraction: {
    name: "Extraction",
    unit: "examples",
    dataset: "meetings-eval-golden",
    experimentPrefix: "eval-golden-extraction",
    gateKey: "pass",
    label: fileLabel,
    groupKey: "bucket",
    patternApplies: true,
    flaky: KNOWN_FLAKY_FILES,
    appliesEvalRuns: true,
    evaluator: extractionEvaluator,
    target: (core, cfg) => (inputs) =>
      extractOne(core, cfg, inputs["transcript"], "extraction"),
  },
  bias: {
    name: "Bias",
    unit: "pairs",
    dataset: "meetings-eval-golden-bias",
    experimentPrefix: "eval-golden-bias",
    gateKey: "parity_pass",
    label: (ex) => meta(ex, "pairId"),
    groupKey: "scenarioLabel",
    patternApplies: false,
    flaky: KNOWN_FLAKY_BIAS_PAIRS,
    appliesEvalRuns: false,
    evaluator: biasEvaluator,
    // Sequential: mirrors the extraction suite's rate-limit posture.
    target: (core, cfg) => async (inputs) => ({
      predictedA: await extractOne(
        core,
        cfg,
        inputs["transcriptA"],
        "variant A",
      ),
      predictedB: await extractOne(
        core,
        cfg,
        inputs["transcriptB"],
        "variant B",
      ),
    }),
  },
};

/**
 * Pre-flight guards, so a mis-shaped dataset fails before we spend money:
 * every example must map to a bucket with pass criteria, and every known-flaky
 * entry must still name a real example (a stale skip entry excludes nothing).
 */
export function validateDatasets(
  extraction: DatasetExample[],
  bias: DatasetExample[],
): void {
  const problems: string[] = [];
  if (extraction.length === 0) problems.push("extraction dataset is empty");
  if (bias.length === 0) problems.push("bias dataset is empty");

  const unlabeled = extraction
    .filter((ex) => !meta(ex, "character") || !meta(ex, "episode"))
    .map((ex) => ex.id);
  if (unlabeled.length > 0) {
    problems.push(
      `examples missing character/episode metadata: ${unlabeled.join(", ")}`,
    );
  }

  const unknown = extraction
    .filter((ex) => !(meta(ex, "bucket") in PASS_CRITERIA))
    .map((ex) => `${fileLabel(ex)} -> ${meta(ex, "bucket")}`);
  if (unknown.length > 0) {
    problems.push(`buckets without PASS_CRITERIA: ${unknown.join(", ")}`);
  }

  for (const [suite, examples] of [
    [SUITES.extraction, extraction],
    [SUITES.bias, bias],
  ] as const) {
    const present = new Set(examples.map((ex) => suite.label(ex)));
    const stale = [...suite.flaky].filter((entry) => !present.has(entry));
    if (stale.length > 0) {
      problems.push(
        `stale ${suite.name} flaky entries (KNOWN_FLAKY_* in types.ts): ${stale.join(", ")}`,
      );
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Dataset consistency check failed:\n- ${problems.join("\n- ")}`,
    );
  }
}

/** Drop known-flaky entries, apply BUCKET_PATTERN, sort by label. */
export function selectExamples(
  examples: DatasetExample[],
  cfg: ExperimentConfig,
  suite: Suite,
): DatasetExample[] {
  const pattern = cfg.bucketPattern;
  return examples
    .filter((ex) => cfg.includeFlaky || !suite.flaky.has(suite.label(ex)))
    .filter(
      (ex) =>
        !pattern ||
        !suite.patternApplies ||
        pattern.test(meta(ex, suite.groupKey)) ||
        pattern.test(suite.label(ex)),
    )
    .sort((a, b) => suite.label(a).localeCompare(suite.label(b)));
}

// =============================================================================
// Running and aggregation
// =============================================================================

/** One repetition's gate outcome for one example. */
export interface GateVote {
  exampleId: string;
  label: string;
  group: string;
  /** true/false = pass/fail; null = inconclusive (excluded from majority). */
  pass: boolean | null;
  comment?: string;
}

export interface ExampleVerdict {
  label: string;
  group: string;
  passes: number;
  votes: number;
  /** Majority verdict; inconclusive examples (no votes) pass the gate. */
  passed: boolean;
  inconclusive: boolean;
  lastComment?: string;
}

const groupBy = <T>(items: T[], key: (item: T) => string): Map<string, T[]> => {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const group = groups.get(key(item)) ?? [];
    group.push(item);
    groups.set(key(item), group);
  }
  return groups;
};

/**
 * Majority-pass verdict per example across repetitions. Strict majority, so a
 * 1/2 split fails; examples with only inconclusive repetitions don't fail the
 * gate but are flagged.
 */
export function aggregateVerdicts(votes: GateVote[]): ExampleVerdict[] {
  return [...groupBy(votes, (v) => v.exampleId).values()]
    .map((group) => {
      const counted = group.filter((v) => v.pass !== null);
      const passes = counted.filter((v) => v.pass).length;
      const inconclusive = counted.length === 0;
      return {
        label: group[0].label,
        group: group[0].group,
        passes,
        votes: counted.length,
        passed: inconclusive || passes * 2 > counted.length,
        inconclusive,
        lastComment: group[group.length - 1].comment,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function summarize(verdicts: ExampleVerdict[]): string {
  const lines: string[] = [];
  for (const [group, items] of [
    ...groupBy(verdicts, (v) => v.group).entries(),
  ].sort()) {
    const passed = items.filter((v) => v.passed).length;
    lines.push(`  ${group}: ${passed}/${items.length} passed`);
    for (const v of items) {
      let status = v.passed ? "PASS" : "FAIL";
      if (v.inconclusive) status = "INCONCLUSIVE";
      const votes = v.votes > 1 ? ` (${v.passes}/${v.votes} runs)` : "";
      lines.push(`    ${status} ${v.label}${votes}`);
      if (!v.passed && v.lastComment) lines.push(`      ${v.lastComment}`);
    }
  }
  return lines.join("\n");
}

export async function listAllExamples(
  client: Client,
  datasetName: string,
): Promise<DatasetExample[]> {
  const examples: DatasetExample[] = [];
  for await (const ex of client.listExamples({ datasetName })) {
    examples.push(ex as unknown as DatasetExample);
  }
  return examples;
}

export interface ExperimentRunResult {
  experimentName: string;
  experimentUrl?: string;
  verdicts: ExampleVerdict[];
  passed: boolean;
}

export async function runSuite(
  client: Client,
  core: SpecialistCore,
  cfg: ExperimentConfig,
  suite: Suite,
  examples: DatasetExample[],
): Promise<ExperimentRunResult> {
  const runs = suite.appliesEvalRuns ? cfg.runs : 1;
  const results = await evaluate(suite.target(core, cfg), {
    data: examples as never,
    evaluators: [suite.evaluator(cfg)],
    numRepetitions: runs,
    maxConcurrency: cfg.concurrency,
    experimentPrefix: suite.experimentPrefix,
    metadata: { runs },
    client,
  });

  const verdicts = aggregateVerdicts(
    results.results.map((row) => {
      const gate = row.evaluationResults.results.find(
        (r) => r.key === suite.gateKey,
      );
      // A missing gate result (the run errored before evaluation) is a fail; a
      // value-only result (no score) is inconclusive.
      let pass: boolean | null = false;
      if (gate !== undefined) {
        pass = gate.score === undefined ? null : Boolean(gate.score);
      }
      const example = row.example as unknown as DatasetExample;
      return {
        exampleId: example.id,
        label: suite.label(example),
        group: meta(example, suite.groupKey),
        pass,
        comment: gate?.comment,
      };
    }),
  );

  let experimentUrl: string | undefined;
  try {
    experimentUrl = await client.getProjectUrl({
      projectName: results.experimentName,
    });
  } catch {
    // Cosmetic only - the name is still printed and searchable in the UI.
  }
  return {
    experimentName: results.experimentName,
    experimentUrl,
    verdicts,
    passed: verdicts.every((v) => v.passed),
  };
}
