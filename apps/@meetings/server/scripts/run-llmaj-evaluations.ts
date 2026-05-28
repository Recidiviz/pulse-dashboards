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
 * Post-hoc LLM-as-a-Judge evaluation script.
 *
 * Finds NotetakingPipelineRun records that succeeded but have not yet been
 * evaluated at the current EVALUATOR_VERSION, runs all evaluators, and writes
 * the results to NotetakingEvaluationRun.
 *
 * ## Prerequisites
 *
 * This script connects to Cloud SQL via the Cloud SQL Auth Proxy. Start it before
 * running the script:
 *
 *   cloud-sql-proxy --port 5432 recidiviz-dashboard-staging:us-central1:meeting
 *   # or for production:
 *   cloud-sql-proxy --port 5432 recidiviz-dashboard-production:us-central1:meeting
 *
 * ## Running
 *
 * Run `nx run-llmaj-evaluations @meetings/server --args="--help"` for usage.
 */

import { Command } from "@commander-js/extra-typings";
import { PrismaPg } from "@prisma/adapter-pg";

import { AGENCY_CONFIGS } from "~@meetings/config/loader";
import { Prisma, PrismaClient, StateCode } from "~@meetings/prisma/client";
import {
  createEvaluatorClients,
  EVALUATOR_VERSION,
  EvaluatorInputs,
  langsmithClient,
  MeetingContext,
  runAllEvaluators,
  TextEvaluatorOutput,
  TranscriptComparisonOutput,
} from "~@meetings/tasks/llm/evaluators";
import {
  DraftingOutput,
  DraftingOutputSchema,
  VerificationOutput,
  VerificationOutputSchema,
} from "~@meetings/tasks/llm/schemas";
import { formatTranscripts } from "~@meetings/tasks/llm/utils";

// =============================================================================
// CLI
// =============================================================================

interface ScriptArgs {
  stateCodes: StateCode[];
  meetingId?: string;
  since?: Date;
  dryRun: boolean;
}

function parseArgs(): ScriptArgs {
  const configuredStateCodes = Object.keys(AGENCY_CONFIGS);

  const program = new Command()
    .name("run-llmaj-evaluations")
    .description(
      "Run LLM-as-a-judge evaluations on successful notetaking pipeline runs that have not yet been evaluated at the current evaluator version",
    )
    .option(
      "--state-codes <state-codes>",
      `Comma-separated state code(s) to evaluate (e.g. US_NE or US_NE,US_PA). If omitted, evaluates all configured states: ${configuredStateCodes.join(", ")}`,
    )
    .option(
      "--meeting-id <meeting-id>",
      "Evaluate a single meeting by ID. Requires --state-codes.",
    )
    .option(
      "--since <date>",
      "Only evaluate pipeline runs created on or after this date (ISO 8601, e.g. 2026-01-01)",
    )
    .option(
      "--dry-run [bool]",
      "Run evaluators but skip writing results to the DB",
    )
    .parse();

  const options = program.opts();

  const rawStateCodes: string[] = options.stateCodes
    ? options.stateCodes.split(",").map((s: string) => s.trim())
    : configuredStateCodes;

  const stateCodes = rawStateCodes.map((code) => {
    if (!configuredStateCodes.includes(code)) {
      console.error(
        `Invalid or unconfigured state code: ${code}. Valid values: ${configuredStateCodes.join(", ")}`,
      );
      process.exit(1);
    }
    return code as StateCode;
  });

  if (options.meetingId && !options.stateCodes) {
    console.error("--meeting-id requires --state-codes");
    process.exit(1);
  }

  let since: Date | undefined;
  if (options.since) {
    since = new Date(options.since);
    if (isNaN(since.getTime())) {
      console.error(`Invalid --since date: ${options.since}`);
      process.exit(1);
    }
  }

  return {
    stateCodes,
    meetingId: options.meetingId,
    since,
    dryRun: options.dryRun !== undefined && options.dryRun !== "false",
  };
}

// =============================================================================
// DATA EXTRACTION HELPERS
// =============================================================================

const meetingInclude = {
  transcriptions: {
    include: {
      utterances: { orderBy: { startTimeMs: "asc" as const } },
    },
    orderBy: { confidence: "desc" as const },
  },
  client: { select: { givenNames: true, surname: true } },
  resident: { select: { givenNames: true, surname: true } },
} satisfies Prisma.MeetingInclude;

type MeetingWithTranscriptions = Prisma.MeetingGetPayload<{
  include: typeof meetingInclude;
}>;

/**
 * Extract drafting output from agent executions.
 * Returns the last DRAFTING attempt (highest attemptNumber). Uses safeParse to
 * narrow Prisma.JsonValue — parse failures are unexpected on a SUCCESS run and
 * are logged as warnings.
 */
function extractDraftingOutput(
  executions: {
    agentType: string;
    attemptNumber: number;
    outputData: Prisma.JsonValue;
  }[],
): DraftingOutput | null {
  const draftingExecutions = executions
    .filter((e) => e.agentType === "DRAFTING")
    .sort((a, b) => b.attemptNumber - a.attemptNumber);

  for (const execution of draftingExecutions) {
    const parsed = DraftingOutputSchema.safeParse(execution.outputData);
    if (parsed.success) return parsed.data;
    console.warn(
      `    ⚠️  DRAFTING attempt ${execution.attemptNumber} failed schema parse: ${parsed.error.message}`,
    );
  }
  return null;
}

/**
 * Extract verification output from agent executions.
 */
function extractVerificationOutput(
  executions: { agentType: string; outputData: Prisma.JsonValue }[],
): VerificationOutput | null {
  const verificationExecution = executions.find(
    (e) => e.agentType === "VERIFICATION",
  );
  if (!verificationExecution) return null;

  const parsed = VerificationOutputSchema.safeParse(
    verificationExecution.outputData,
  );
  if (!parsed.success) {
    console.warn(
      `    ⚠️  VERIFICATION execution failed schema parse: ${parsed.error.message}`,
    );
    return null;
  }
  return parsed.data;
}

/**
 * Build EvaluatorInputs from a pipeline run and its associated meeting data.
 * Returns null if required data is missing (no audio, no transcripts, etc.)
 */
function buildEvaluatorInputs(
  meeting: MeetingWithTranscriptions,
  draftingOutput: DraftingOutput,
  verificationOutput: VerificationOutput,
): EvaluatorInputs | null {
  if (!meeting.finalRecordingGCSPath) return null;
  if (meeting.transcriptions.length === 0) return null;

  const { byProvider: transcriptsByProvider, best: bestTranscript } =
    formatTranscripts(meeting.transcriptions);

  const person = meeting.client ?? meeting.resident;
  const meetingContext: MeetingContext = {
    personName: person
      ? [person.givenNames, person.surname].filter(Boolean).join(" ")
      : undefined,
    staffEmail: meeting.staffEmail,
    staffNotes: meeting.userNotepadNotes ?? undefined,
  };

  return {
    audioBucket: meeting.recordingsGCSBucket,
    audioPath: meeting.finalRecordingGCSPath,
    transcriptsByProvider,
    bestTranscript,
    caseNote: draftingOutput.caseNote,
    actionItems: verificationOutput.actionItems,
    criticalUpdates: verificationOutput.criticalUpdates,
    meetingContext,
  };
}

// =============================================================================
// FORMATTING HELPERS
// =============================================================================

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
} as const;

function colorGrade(grade: string): string {
  switch (grade.toUpperCase()) {
    case "GOOD":
      return `${c.green}${c.bold}${grade}${c.reset}`;
    case "PARTIAL":
      return `${c.yellow}${c.bold}${grade}${c.reset}`;
    case "BAD":
      return `${c.red}${c.bold}${grade}${c.reset}`;
    case "ERR":
      return `${c.red}${grade}${c.reset}`;
    default:
      return grade;
  }
}

function colorTranscriptWinner(winner: string): string {
  return winner === "ERR"
    ? `${c.red}${winner}${c.reset}`
    : `${c.cyan}${winner}${c.reset}`;
}

function wrapText(text: string, indent: string, maxWidth = 100): string {
  const available = maxWidth - indent.length;
  if (text.length <= available) return indent + text;
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current.length + (current ? 1 : 0) + word.length > available) {
      if (current) lines.push(indent + current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(indent + current);
  return lines.join("\n");
}

function printScoreDetail(
  key: string,
  score: TranscriptComparisonOutput | TextEvaluatorOutput,
): void {
  const gradeOrWinner = "winner" in score ? score.winner : score.grade;
  const { rationale } = score;
  const hallucinations = "hallucinations" in score ? score.hallucinations : [];
  const omissions = "omissions" in score ? score.omissions : [];

  const label = `${c.bold}${key}${c.reset}`;
  const colored =
    key === "transcriptComparison"
      ? colorTranscriptWinner(gradeOrWinner)
      : colorGrade(gradeOrWinner);

  const providerGrades =
    "assemblyAiGrade" in score
      ? `  ${c.dim}(AssemblyAI: ${colorGrade(score.assemblyAiGrade)}${c.dim}  Deepgram: ${colorGrade(score.deepgramGrade)}${c.dim})${c.reset}`
      : "";

  console.log(`    ${c.dim}┌─${c.reset} ${label}: ${colored}${providerGrades}`);
  console.log(
    wrapText(`${c.dim}│${c.reset}  ${c.dim}${rationale}${c.reset}`, "      "),
  );

  if (hallucinations.length > 0) {
    console.log(`      ${c.dim}│${c.reset}`);
    console.log(`      ${c.dim}│${c.reset}  ${c.red}Hallucinations:${c.reset}`);
    for (const h of hallucinations) {
      console.log(
        wrapText(`${c.dim}│${c.reset}    ${c.red}•${c.reset} ${h}`, "      "),
      );
    }
  }

  if (omissions.length > 0) {
    console.log(`      ${c.dim}│${c.reset}`);
    console.log(`      ${c.dim}│${c.reset}  ${c.yellow}Omissions:${c.reset}`);
    for (const o of omissions) {
      console.log(
        wrapText(
          `${c.dim}│${c.reset}    ${c.yellow}•${c.reset} ${o}`,
          "      ",
        ),
      );
    }
  }

  console.log(`      ${c.dim}└─${c.reset}`);
}

// =============================================================================
// PER-STATE EVALUATION
// =============================================================================

async function evaluateForStateCode(
  stateCode: StateCode,
  meetingId: string | undefined,
  since: Date | undefined,
  dryRun: boolean,
  dbUrlTemplate: string,
): Promise<{ success: number; skipped: number; errors: number }> {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: dbUrlTemplate.replace(
        "{state}",
        stateCode.toLowerCase(),
      ),
    }),
  });

  try {
    // Find pipeline runs that succeeded and haven't been evaluated at this version.
    // When targeting a specific meeting, skip the already-evaluated exclusion so
    // re-evaluation is always possible.
    const pipelineRuns = await prisma.notetakingPipelineRun.findMany({
      where: {
        status: "SUCCESS",
        ...(meetingId
          ? { meetingId }
          : {
              evaluationRuns: {
                none: { evaluatorVersion: EVALUATOR_VERSION },
              },
            }),
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      include: {
        agentExecutions: {
          orderBy: { attemptNumber: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    console.log(
      `\n${c.bold}${c.blue}${stateCode}${c.reset}  ${c.dim}${pipelineRuns.length} pipeline run(s) to evaluate${c.reset}`,
    );

    const evaluatorClients = createEvaluatorClients();

    let success = 0;
    let skipped = 0;
    let errors = 0;

    for (const run of pipelineRuns) {
      try {
        const draftingOutput = extractDraftingOutput(run.agentExecutions);
        const verificationOutput = extractVerificationOutput(
          run.agentExecutions,
        );

        if (!draftingOutput || !verificationOutput) {
          console.warn(
            `    ⚠️  Skipping run ${run.id} — missing drafting or verification output`,
          );
          skipped++;
          continue;
        }

        // Fetch the associated meeting for audio path and transcripts
        // eslint-disable-next-line no-await-in-loop
        const meeting = await prisma.meeting.findUnique({
          where: { id: run.meetingId },
          include: meetingInclude,
        });

        if (!meeting) {
          console.warn(
            `    ⚠️  Skipping run ${run.id} — meeting ${run.meetingId} not found`,
          );
          skipped++;
          continue;
        }

        const inputs = buildEvaluatorInputs(
          meeting,
          draftingOutput,
          verificationOutput,
        );

        if (!inputs) {
          console.warn(
            `    ⚠️  Skipping run ${run.id} — missing audio or transcripts for meeting ${run.meetingId}`,
          );
          skipped++;
          continue;
        }

        // eslint-disable-next-line no-await-in-loop
        const { scores, langsmithTraceId } = await runAllEvaluators(
          evaluatorClients,
          inputs,
        );

        if (!dryRun) {
          // eslint-disable-next-line no-await-in-loop
          await prisma.notetakingEvaluationRun.create({
            data: {
              pipelineRunId: run.id,
              evaluatorVersion: EVALUATOR_VERSION,
              scores,
              langsmithTraceId,
            },
          });
        }

        const prefix = dryRun ? `${c.dim}[dry-run]${c.reset} ` : "";
        const gradesSummary = [
          scores.transcriptComparison
            ? `transcript=${colorTranscriptWinner(scores.transcriptComparison.winner)}`
            : `transcript=${colorGrade("ERR")}`,
          scores.caseNote
            ? `note=${colorGrade(scores.caseNote.grade)}`
            : `note=${colorGrade("ERR")}`,
          scores.actionItems
            ? `actions=${colorGrade(scores.actionItems.grade)}`
            : `actions=${colorGrade("ERR")}`,
          scores.criticalUpdates
            ? `updates=${colorGrade(scores.criticalUpdates.grade)}`
            : `updates=${colorGrade("ERR")}`,
          scores.overall
            ? `overall=${colorGrade(scores.overall.grade)}`
            : `overall=${colorGrade("ERR")}`,
        ].join(`  ${c.dim}|${c.reset}  `);

        console.log(
          `\n  ${prefix}${c.green}✓${c.reset} ${c.bold}${run.id}${c.reset}`,
        );
        console.log(`    ${gradesSummary}\n`);

        for (const [key, score] of Object.entries(scores)) {
          if (!score) continue;
          printScoreDetail(key, score);
        }
        success++;
      } catch (err) {
        console.error(
          `    ❌ Error evaluating run ${run.id}:`,
          err instanceof Error ? err.message : err,
        );
        errors++;
      }
    }

    return { success, skipped, errors };
  } finally {
    await prisma.$disconnect();
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log(
    `\n${c.bold}${c.cyan}🔍 LLM-as-a-Judge Evaluation${c.reset}  ${c.dim}version=${EVALUATOR_VERSION}${c.reset}\n`,
  );

  const { stateCodes, meetingId, since, dryRun } = parseArgs();

  const dbUrlTemplate = process.env["DATABASE_URL_TEMPLATE"];
  if (!dbUrlTemplate) {
    throw new Error("Missing DATABASE_URL_TEMPLATE environment variable");
  }

  if (dryRun) {
    console.log(
      `${c.yellow}${c.bold}DRY RUN${c.reset}${c.yellow} — evaluations will run but results will not be written to the DB${c.reset}\n`,
    );
  }

  let totalSuccess = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const stateCode of stateCodes) {
    // eslint-disable-next-line no-await-in-loop
    const { success, skipped, errors } = await evaluateForStateCode(
      stateCode,
      meetingId,
      since,
      dryRun,
      dbUrlTemplate,
    );
    totalSuccess += success;
    totalSkipped += skipped;
    totalErrors += errors;
  }

  const errColor = totalErrors > 0 ? c.red : c.dim;
  console.log(
    `\n${c.bold}Done.${c.reset}  ${c.green}${totalSuccess} evaluated${c.reset}  ${c.dim}${totalSkipped} skipped${c.reset}  ${errColor}${totalErrors} errors${c.reset}\n`,
  );

  await langsmithClient.awaitPendingTraceBatches();
  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
