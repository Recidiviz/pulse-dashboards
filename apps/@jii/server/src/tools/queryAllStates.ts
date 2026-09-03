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

import { ArgumentParser } from "argparse";
import { readFileSync } from "fs";

import { StateCode, stateCodes } from "~@jii/configs";
import { getPrismaClient, resolveDatabaseTarget } from "~@jii/prisma";

/**
 * Runs one read-only query against each state's database in turn, for the
 * environment the usual database resolution lands on (see the nx target, which
 * points this at the staging proxy). Each state has its own database, so
 * answering general questions about the contents of our data models otherwise
 * means running the same query by hand once per state.
 *
 * States are queried sequentially so that output stays readable and only one
 * connection is open at a time. A state that fails doesn't stop the others; the
 * failures are summarized at the end and the process exits non-zero.
 */

const parser = new ArgumentParser({
  description: "Run a read-only SQL query against every enabled state database",
});

const querySource = parser.add_mutually_exclusive_group({ required: true });
querySource.add_argument("-q", "--query", {
  help: "SQL command to run for each state, provided inline",
});
// deliberately not --query-file: it would share a prefix with --query, and an abbreviated
// form (nx re-serializes `-q X` as `--q=X`) would then be ambiguous between the two
querySource.add_argument("-f", "--file", {
  dest: "queryFile",
  help: "Path to a file containing the SQL to run for each state",
});

parser.add_argument("--states", {
  help: "Comma-separated state codes to query (defaults to ENABLED_STATE_DBS)",
});

// takes an optional value rather than being a plain flag: nx re-serializes a bare `--demo`
// into `--demo=true` when forwarding it, which a store_true argument rejects outright
parser.add_argument("--demo", {
  nargs: "?",
  const: "true",
  default: "false",
  choices: ["true", "false"],
  help: "Query the demo databases instead of the primary ones",
});

type Args = {
  query?: string;
  queryFile?: string;
  states?: string;
  demo: "true" | "false";
};

const args = parser.parse_args() as Args;
const useDemoDbs = args.demo === "true";

function getStateCodesToQuery(): Array<StateCode> {
  const source = args.states ?? process.env["ENABLED_STATE_DBS"];

  if (!source) {
    throw new Error(
      "No states specified: pass --states or set ENABLED_STATE_DBS",
    );
  }

  return source.split(",").map((s) => stateCodes.parse(s.trim().toUpperCase()));
}

/**
 * This tool is pointed at shared databases, so it only runs statements that can't
 * modify anything. Postgres allows data-modifying CTEs (`WITH ... AS (DELETE ...
 * RETURNING ...)`), so even a leading WITH isn't safe to accept; and a trailing
 * statement after a semicolon could be anything at all. This is a guard against
 * mistakes, not a hard security boundary as enforced by GCP permissions.
 */
function requireReadOnly(sql: string) {
  const trimmed = sql.trim().replace(/;\s*$/, "");

  if (trimmed.includes(";")) {
    throw new Error(
      "Only a single statement is allowed; remove the extra semicolon.",
    );
  }

  if (!/^select\s/i.test(trimmed)) {
    throw new Error(
      "Only SELECT statements are allowed (CTEs are rejected because Postgres lets them modify data).",
    );
  }

  return trimmed;
}

type QueryRows = Array<Record<string, unknown>>;

function formatValue(value: unknown): string {
  // Postgres returns count() as a bigint, which JSON.stringify refuses to serialize.
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value === null) return "null";
  if (typeof value === "object") {
    return JSON.stringify(value, (_, v) =>
      typeof v === "bigint" ? v.toString() : v,
    );
  }
  return String(value);
}

function formatRows(rows: QueryRows): string {
  if (rows.length === 0) return "(no rows)";

  return rows
    .map((row) =>
      Object.entries(row)
        .map(
          // more concise and readable than bare json
          ([key, value]) => `${key}=${formatValue(value)}`,
        )
        .join("  "),
    )
    .join("\n    ");
}

async function main() {
  const sql = requireReadOnly(
    args.query ?? readFileSync(args.queryFile as string, "utf-8"),
  );
  const stateCodesToQuery = getStateCodesToQuery();

  console.log(`Database target: ${resolveDatabaseTarget()}`);
  console.log(
    `Querying ${stateCodesToQuery.length} state(s)${useDemoDbs ? " (demo)" : ""}:\n${sql}\n`,
  );

  const failures: Array<{ stateCode: StateCode; message: string }> = [];

  for (const stateCode of stateCodesToQuery) {
    // resolving the client happens inside the try so that a state with no database
    // configured is reported like any other failure instead of ending the whole run
    let prismaClient: ReturnType<typeof getPrismaClient> | undefined;

    try {
      prismaClient = getPrismaClient({ stateCode, demo: useDemoDbs });
      // eslint-disable-next-line no-await-in-loop
      const rows = await prismaClient.$queryRawUnsafe<QueryRows>(sql);
      console.log(`  ${stateCode}: ${formatRows(rows)}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      failures.push({ stateCode, message });
      console.log(`  ${stateCode}: FAILED`);
    } finally {
      // eslint-disable-next-line no-await-in-loop
      await prismaClient?.$disconnect();
    }
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} state(s) failed:`);
    for (const { stateCode, message } of failures) {
      console.error(`  ${stateCode}: ${message}`);
    }
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error("[queryAllStates] Fatal error:", e.message ?? e);
  process.exitCode = 1;
});
