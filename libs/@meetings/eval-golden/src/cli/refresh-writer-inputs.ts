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
 *   nx run @meetings/eval-golden:refresh-writer-inputs
 *
 * Run this after a change to the golden dataset's ground truth or to the
 * US_DEMO config.
 *
 * This writes directly to the shared `meetings-eval-golden` dataset, so
 * before a first real run, sanity-check with:
 *
 *   nx run @meetings/eval-golden:refresh-writer-inputs --args="--dry-run"
 *   nx run @meetings/eval-golden:refresh-writer-inputs --args="--limit 1"
 */

import { Command } from "@commander-js/extra-typings";
import { Client as LangSmithClient } from "langsmith";

import { generateConfigKey } from "~@meetings/config";
import {
  EVAL_PERSON,
  transcriptFromScript,
} from "~@meetings/eval-golden/stubs";
import { truthFileSchema } from "~@meetings/eval-golden/types";
import { getGlobalPrismaClient } from "~@meetings/prisma";
import {
  buildWriterUserVariables,
  WriterFacts,
} from "~@meetings/tasks/llm/writerInputs";
import { getAgencyConfig } from "~@meetings/trpc/routes/config/utils";

const DATASET_NAME = "meetings-eval-golden";
const STATE_CODE = "US_DEMO";

interface ScriptArgs {
  /** Logs what would change without calling `updateExample`. */
  dryRun: boolean;
  /** Stops after this many examples (dry run or not) - unset processes all. */
  limit?: number;
}

function parseArgs(): ScriptArgs {
  const program = new Command()
    .name("refresh-writer-inputs")
    .description(
      `Refresh writer prompt inputs on every example in the ${DATASET_NAME} LangSmith dataset`,
    )
    .option("--dry-run", "Log what would change without writing any examples")
    .option(
      "--limit <count>",
      "Stop after this many examples (dry run or not)",
      (value) => {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed < 1) {
          console.error(`--limit must be a positive integer, got: ${value}`);
          process.exit(1);
        }
        return parsed;
      },
    )
    .parse();

  const options = program.opts();
  return { dryRun: Boolean(options.dryRun), limit: options.limit };
}

async function main(): Promise<void> {
  const { dryRun, limit } = parseArgs();

  const langsmithApiKey =
    process.env["LANGSMITH_API_KEY"] ?? process.env["LANGCHAIN_API_KEY"];
  if (!langsmithApiKey) {
    throw new Error(
      "LANGSMITH_API_KEY / LANGCHAIN_API_KEY is not set. Run via " +
        "`nx run @meetings/eval-golden:refresh-writer-inputs` so the sops env loads.",
    );
  }

  const agency = await getAgencyConfig(STATE_CODE);
  if (!agency) {
    throw new Error(`No AgencyConfig found for ${STATE_CODE}.`);
  }
  const configKey = generateConfigKey(agency);
  console.log(`Resolved ${STATE_CODE} agency config: ${configKey}`);
  if (dryRun) {
    console.log("--dry-run: no examples will be written.");
  }

  if (limit !== undefined) {
    console.log(`--limit ${limit}: stopping early.`);
  }

  const langsmith = new LangSmithClient({ apiKey: langsmithApiKey });

  let updated = 0;
  let skipped = 0;
  for await (const example of langsmith.listExamples({
    datasetName: DATASET_NAME,
  })) {
    if (limit !== undefined && updated >= limit) break;

    const rawTranscript = String(example.inputs["transcript"] ?? "");
    if (!rawTranscript) {
      console.warn(`Skipping ${example.id}: no "transcript" in inputs.`);
      skipped++;
      continue;
    }

    const parsedFacts = truthFileSchema.safeParse(example.outputs ?? {});
    if (!parsedFacts.success) {
      console.warn(
        `Skipping ${example.id}: outputs don't match the truth schema: ` +
          parsedFacts.error.issues.map((i) => i.message).join("; "),
      );
      skipped++;
      continue;
    }
    const facts: WriterFacts = parsedFacts.data;

    const transcript = transcriptFromScript(rawTranscript);
    const writerVars = buildWriterUserVariables(
      transcript,
      facts,
      agency,
      EVAL_PERSON,
    );

    if (dryRun) {
      console.log(`[dry-run] would refresh ${example.id}:`);
      console.log(writerVars);
    } else {
      await langsmith.updateExample({
        id: example.id,
        inputs: { ...example.inputs, ...writerVars },
        metadata: {
          ...example.metadata,
          writerInputsConfigKey: configKey,
          writerInputsRefreshedAt: new Date().toISOString(),
        },
      });
    }
    updated++;
    console.log(
      `[${updated}] ${dryRun ? "would refresh" : "refreshed"} ${example.id}`,
    );
  }

  console.log(
    `\n${dryRun ? "Would refresh" : "Refreshed"} writer inputs for ${updated} example(s) against ${configKey}` +
      (skipped > 0 ? ` (${skipped} skipped).` : "."),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getGlobalPrismaClient().$disconnect();
  });
