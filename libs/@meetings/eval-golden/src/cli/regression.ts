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
 * Golden-dataset regression eval: runs each suite as a LangSmith experiment
 * (results browsable in the UI) and exits non-zero when any example fails its
 * PASS_CRITERIA gate. Hits real OpenAI/LangSmith APIs - run via
 * `nx run @meetings/eval-golden:regression`.
 *
 * Env knobs (see README): EVAL_SUITE=extraction|bias|all, EVAL_RUNS,
 * BUCKET_PATTERN, EVAL_ERROR_RETRIES, EVAL_INCLUDE_FLAKY, EVAL_CONCURRENCY,
 * EVAL_SUMMARY_FILE.
 */

import { writeFileSync } from "fs";
import { Client } from "langsmith";

import type { ExperimentRunResult } from "~@meetings/eval-golden/experiments";
import {
  configFromEnv,
  listAllExamples,
  runSuite,
  selectExamples,
  SUITES,
  summarize,
  validateDatasets,
} from "~@meetings/eval-golden/experiments";
import { SpecialistCore } from "~@meetings/tasks/llm/agents";

type Result = [name: string, result: ExperimentRunResult];

/** Markdown summary for CI (step summary / sticky PR comment). */
function writeSummaryFile(path: string, results: Result[]): void {
  const counts = ({ verdicts }: ExperimentRunResult): string => {
    const inconclusive = verdicts.filter((v) => v.inconclusive).length;
    const note = inconclusive > 0 ? ` (${inconclusive} inconclusive)` : "";
    return `${verdicts.filter((v) => v.passed).length}/${verdicts.length} passed${note}`;
  };
  writeFileSync(
    path,
    [
      `## Meetings Eval: ${results.every(([, r]) => r.passed) ? "Passed" : "Failed"}`,
      "",
      "| Suite | Result | Examples | Experiment |",
      "| --- | --- | --- | --- |",
      ...results.map(
        ([name, r]) =>
          `| ${name} | ${r.passed ? "PASS" : "FAIL"} | ${counts(r)} | ${
            r.experimentUrl
              ? `[${r.experimentName}](${r.experimentUrl})`
              : r.experimentName
          } |`,
      ),
      "",
      "<details><summary>Per-example results</summary>",
      "",
      "```",
      ...results.map(([name, r]) => `${name}:\n${summarize(r.verdicts)}`),
      "```",
      "",
      "</details>",
      "",
    ].join("\n"),
  );
}

async function main(): Promise<void> {
  const apiKey =
    process.env["LANGSMITH_API_KEY"] ?? process.env["LANGCHAIN_API_KEY"];
  if (!apiKey) {
    throw new Error(
      "LANGSMITH_API_KEY / LANGCHAIN_API_KEY is not set. Run via " +
        "`nx run @meetings/eval-golden:regression` so the sops env loads.",
    );
  }
  const selected = process.env["EVAL_SUITE"] ?? "all";
  const cfg = configFromEnv();
  const client = new Client({ apiKey });
  const core = SpecialistCore.factory();

  const examplesBySuite = Object.fromEntries(
    await Promise.all(
      Object.entries(SUITES).map(async ([key, suite]) => [
        key,
        await listAllExamples(client, suite.dataset),
      ]),
    ),
  );
  validateDatasets(examplesBySuite["extraction"], examplesBySuite["bias"]);

  const results: Result[] = [];
  for (const [key, suite] of Object.entries(SUITES)) {
    if (selected !== "all" && selected !== key) continue;
    const examples = selectExamples(examplesBySuite[key], cfg, suite);
    if (examples.length === 0) {
      console.log(`No ${key} ${suite.unit} match the current filters.`);
      continue;
    }
    const repetitions = suite.appliesEvalRuns
      ? `, ${cfg.runs} run(s) each`
      : "";
    console.log(
      `\nRunning ${key} experiment: ${examples.length} ${suite.unit}${repetitions}`,
    );
    // eslint-disable-next-line no-await-in-loop
    const result = await runSuite(client, core, cfg, suite, examples);
    results.push([suite.name, result]);
    console.log(`\n=== ${suite.name}: ${result.passed ? "PASS" : "FAIL"}`);
    console.log(`Experiment: ${result.experimentName}`);
    if (result.experimentUrl) console.log(result.experimentUrl);
    console.log(summarize(result.verdicts));
  }

  const summaryFile = process.env["EVAL_SUMMARY_FILE"];
  if (summaryFile && results.length > 0) writeSummaryFile(summaryFile, results);

  process.exitCode = results.every(([, r]) => r.passed) ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
