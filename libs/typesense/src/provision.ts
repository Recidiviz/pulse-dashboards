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

// Provisions Typesense collections from the shared schema set against a
// remote (staging/production) cluster. The Firebase→Typesense extension
// requires collections to exist before sync starts; this script creates them.
//
// Usage:
//   nx provision typesense -c staging                  (safe: create-if-not-exists)
//   nx provision typesense -c staging -- --recreate    (DESTRUCTIVE: drop + recreate)
//
// Default behavior is create-if-not-exists — safe to re-run, won't touch
// existing collections or their data.
//
// ⚠️  --recreate is DESTRUCTIVE.
// It drops each matching collection (deleting ALL DOCUMENTS in it) and
// recreates it from the schema. There is no undo. The script prompts for
// confirmation before doing anything destructive; pass `--skip-prompts` to
// skip the prompt (intended for CI / automation only).

import * as readline from "node:readline";

import type { Client as TypesenseClient } from "typesense";

import { createTypesenseClient } from "./client";
import { schemas } from "./schemas";

// Detects boolean CLI flags in any of the forms nx might pass them through as:
//   --foo            (bare)
//   --foo=true       (nx normalizes bare bools to =true when forwarding)
//   --foo=1          (rare, but handle for completeness)
// Returns false for absent flag, --foo=false, or --foo=0.
function hasFlag(flag: string): boolean {
  const prefix = `--${flag}`;
  return process.argv.some((arg) => {
    if (arg === prefix) return true;
    if (!arg.startsWith(`${prefix}=`)) return false;
    const value = arg.slice(prefix.length + 1).toLowerCase();
    return value !== "false" && value !== "0";
  });
}

// Reads a single line from stdin and resolves with the trimmed answer.
// Returns null if stdin isn't a TTY (e.g. running in CI without --skip-prompts) so
// callers can fail closed instead of hanging.
async function promptForConfirmation(prompt: string): Promise<string | null> {
  if (!process.stdin.isTTY) return null;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    return await new Promise<string>((resolve) => {
      rl.question(prompt, (answer) => resolve(answer.trim()));
    });
  } finally {
    rl.close();
  }
}

async function collectionExists(
  client: TypesenseClient,
  name: string,
): Promise<boolean> {
  try {
    await client.collections(name).retrieve();
    return true;
  } catch (err: unknown) {
    const status = (err as { httpStatus?: number })?.httpStatus;
    if (status === 404) return false;
    throw err;
  }
}

async function provisionCollection(
  client: TypesenseClient,
  schema: (typeof schemas)[number],
  recreate: boolean,
): Promise<"created" | "recreated" | "skipped"> {
  const exists = await collectionExists(client, schema.name);

  if (!exists) {
    await client.collections().create(schema);
    return "created";
  }

  if (recreate) {
    await client.collections(schema.name).delete();
    await client.collections().create(schema);
    return "recreated";
  }

  // collection exists and we should not recreate
  return "skipped";
}

async function main(): Promise<void> {
  // Require explicit env vars — no offline-style defaults. Pointing this at
  // localhost or running it against the wrong cluster would be very bad.
  const host = process.env["TYPESENSE_HOST"];
  const apiKey = process.env["TYPESENSE_ADMIN_API_KEY"];
  if (!host) {
    console.error(
      "TYPESENSE_HOST is required (e.g. https://typesense-staging.recidiviz.org)",
    );
    process.exit(1);
  }
  if (!apiKey) {
    console.error(
      "TYPESENSE_ADMIN_API_KEY is required (typesense-admin-api-key from the cluster's k8s secret — NOT the search-only TYPESENSE_API_KEY)",
    );
    process.exit(1);
  }

  const recreate = hasFlag("recreate");
  const skipPrompts = hasFlag("skip-prompts");
  const client = createTypesenseClient({ host, apiKey });

  // Confirm we can reach the cluster before doing anything destructive.
  const health = await client.health.retrieve();
  if (!health.ok) {
    console.error(`Typesense health check failed: ${JSON.stringify(health)}`);
    process.exit(1);
  }
  console.info(
    `Connected to ${host} — provisioning ${schemas.length} collections${recreate ? " (recreate mode)" : ""}`,
  );

  // Destructive-action confirmation gate. --recreate drops + recreates every
  // collection in the schema set (which exists in the cluster), permanently
  // deleting all documents. Show the operator exactly which collections will
  // be affected and require an explicit "yes" before proceeding.
  // --skip-prompts bypasses the prompt for automation; a non-TTY context
  // (no stdin) fails closed unless --skip-prompts was passed.
  if (recreate && !skipPrompts) {
    const existing: string[] = [];
    for (const schema of schemas) {
      // eslint-disable-next-line no-await-in-loop -- short, ordered listing
      if (await collectionExists(client, schema.name)) {
        existing.push(schema.name);
      }
    }

    if (existing.length === 0) {
      console.info(
        "Nothing to recreate — no matching collections exist. Will create fresh.",
      );
    } else {
      console.warn(
        "\n⚠️  --recreate will DROP and RECREATE the following collections:",
      );
      for (const name of existing) console.warn(`    - ${name}`);
      console.warn(`  on host: ${host}`);
      console.warn(
        "  ALL DOCUMENTS in these collections will be permanently deleted.\n",
      );

      const answer = await promptForConfirmation(
        "Type 'yes' to continue, anything else to abort: ",
      );
      if (answer === null) {
        console.error(
          "stdin is not a TTY — refusing to prompt. Re-run with --skip-prompts if you intend to recreate (CI / automation only).",
        );
        process.exit(1);
      }
      if (answer.toLowerCase() !== "yes") {
        console.info("Aborted. No collections were modified.");
        process.exit(0);
      }
    }
  }

  /* eslint-disable no-await-in-loop -- intentional: sequential output is easier to read */
  for (const schema of schemas) {
    try {
      const result = await provisionCollection(client, schema, recreate);
      console.info(`[${schema.name}] ${result}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[${schema.name}] failed: ${message}`);
      process.exit(1);
    }
  }
  /* eslint-enable no-await-in-loop */

  console.info("Provision complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
