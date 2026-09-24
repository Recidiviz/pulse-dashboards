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
//   nx provision '@typesense/tools' -c staging                  (safe: create-if-not-exists)
//   nx provision '@typesense/tools' -c staging -- --recreate    (DESTRUCTIVE: drop + recreate)
//   nx provision '@typesense/tools' -c staging -- --help        (full flag reference)
//
//   Retire a collection the schema no longer declares (DESTRUCTIVE, drop only):
//   nx provision '@typesense/tools' -c staging -- --delete --collection=oldThing
//
//   Limit to specific collections (repeatable and/or comma-separated):
//   nx provision '@typesense/tools' -c staging -- --collection=opportunities
//   nx provision '@typesense/tools' -c staging -- --collection=opportunities,clients
//
// Default behavior is create-if-not-exists across every schema — safe to
// re-run, won't touch existing collections or their data.
//
// ⚠️  --delete is DESTRUCTIVE and does NOT recreate.
// It drops each named collection and stops. Unlike every other mode it does
// not consult `schemas` — retiring a collection means the schema entry is
// already gone — so it names the collections on the CLUSTER instead, and
// requires --collection explicitly. There is no "delete everything".
//
// ⚠️  --recreate is DESTRUCTIVE.
// It drops each matching collection (deleting ALL DOCUMENTS in it) and
// recreates it from the schema. There is no undo. The script prompts for
// confirmation before doing anything destructive; pass `--skip-prompts` to
// skip the prompt (intended for CI / automation only).

import * as readline from "node:readline";

import { Command } from "@commander-js/extra-typings";
import type { Client as TypesenseClient } from "typesense";

import { createTypesenseClient, schemas } from "~@typesense/client";

import { parseBooleanFlag } from "./cli";

type ScriptArgs = {
  collections: string[];
  recreate: boolean;
  delete: boolean;
  skipPrompts: boolean;
};

function parseArgs(): ScriptArgs {
  const available = schemas.map((schema) => schema.name).join(", ");

  const program = new Command()
    .name("provision")
    .description(
      "Create Typesense collections from the shared schema set on a remote cluster",
    )
    .option(
      "--collection <names>",
      `Collection(s) to provision — repeatable and/or comma-separated. Defaults to all: ${available}`,
      (value: string, previous: string[]) => [
        ...previous,
        ...value
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean),
      ],
      [] as string[],
    )
    .option(
      "--recreate [bool]",
      "DESTRUCTIVE: drop and recreate each targeted collection, deleting all of its documents",
      parseBooleanFlag,
      false,
    )
    .option(
      "--delete [bool]",
      "DESTRUCTIVE: drop each targeted collection and do not recreate it. Requires --collection",
      parseBooleanFlag,
      false,
    )
    .option(
      "--skip-prompts [bool]",
      "Skip the destructive-action confirmation prompt (CI / automation only)",
      parseBooleanFlag,
      false,
    )
    .parse();

  const options = program.opts();

  if (options.delete && options.recreate) {
    console.error(
      "--delete and --recreate are mutually exclusive: one drops and stops, the other drops and recreates.",
    );
    process.exit(1);
  }

  // A bare --delete would drop the whole cluster. Naming is mandatory.
  if (options.delete && options.collection.length === 0) {
    console.error("--delete requires --collection. There is no delete-all.");
    process.exit(1);
  }

  // Unknown names are a hard error rather than a silent no-op — a typo here
  // would otherwise look like a successful run that provisioned nothing.
  //
  // Skipped for --delete, which exists to retire a collection the schema has
  // already dropped. Its names are checked against the cluster instead.
  if (!options.delete) {
    const unknown = options.collection.filter(
      (name) => !schemas.some((schema) => schema.name === name),
    );
    if (unknown.length > 0) {
      console.error(
        `Unknown collection(s): ${unknown.join(", ")}\nAvailable: ${available}`,
      );
      process.exit(1);
    }
  }

  return {
    collections: options.collection,
    recreate: options.recreate,
    delete: options.delete,
    skipPrompts: options.skipPrompts,
  };
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

/**
 * Drops each named collection and stops.
 *
 * Names come from the operator rather than from `schemas`, because the reason
 * to run this is that the schema entry is already gone. A name that is not on
 * the cluster is reported and skipped — re-running after a partial failure
 * should not be an error.
 */
async function deleteCollections(
  client: TypesenseClient,
  names: string[],
  host: string,
  skipPrompts: boolean,
): Promise<void> {
  const present: string[] = [];
  for (const name of names) {
    // eslint-disable-next-line no-await-in-loop -- short, ordered listing
    if (await collectionExists(client, name)) present.push(name);
    else console.info(`[${name}] not on this cluster — nothing to delete`);
  }

  if (present.length === 0) {
    console.info("Nothing to delete.");
    process.exit(0);
  }

  if (!skipPrompts) {
    console.warn("\n⚠️  --delete will DROP the following collections:");
    for (const name of present) console.warn(`    - ${name}`);
    console.warn(`  on host: ${host}`);
    console.warn(
      "  They will NOT be recreated. ALL DOCUMENTS in them are permanently deleted.\n",
    );

    const answer = await promptForConfirmation(
      "Type 'yes' to continue, anything else to abort: ",
    );
    if (answer === null) {
      console.error(
        "stdin is not a TTY — refusing to prompt. Re-run with --skip-prompts if you intend to delete (CI / automation only).",
      );
      process.exit(1);
    }
    if (answer.toLowerCase() !== "yes") {
      console.info("Aborted. No collections were modified.");
      process.exit(0);
    }
  }

  /* eslint-disable no-await-in-loop -- intentional: sequential output is easier to read */
  for (const name of present) {
    try {
      await client.collections(name).delete();
      console.info(`[${name}] deleted`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[${name}] failed: ${message}`);
      process.exit(1);
    }
  }
  /* eslint-enable no-await-in-loop */

  console.info("Delete complete.");
  process.exit(0);
}

async function main(): Promise<void> {
  // Parse before the env checks so `--help` works without a configured cluster.
  const {
    collections: requested,
    recreate,
    delete: deleteMode,
    skipPrompts,
  } = parseArgs();

  // Require explicit env vars — no offline-style defaults. Pointing this at
  // localhost or running it against the wrong cluster would be very bad.
  const host = process.env["TYPESENSE_HOST"];
  const apiKey = process.env["TYPESENSE_API_WRITE_KEY"];
  if (!host) {
    console.error(
      "TYPESENSE_HOST is required (e.g. https://typesense-staging.recidiviz.org)",
    );
    process.exit(1);
  }
  if (!apiKey) {
    console.error(
      "TYPESENSE_API_WRITE_KEY is required (request elevated jit permissions)",
    );
    process.exit(1);
  }

  // Narrow the schema set to the requested collections, so a new collection can
  // be provisioned without touching the ones already in use.
  const targetSchemas =
    requested.length > 0
      ? schemas.filter((schema) => requested.includes(schema.name))
      : schemas;

  const client = createTypesenseClient({ host, apiKey });

  // Confirm we can reach the cluster before doing anything destructive.
  const health = await client.health.retrieve();
  if (!health.ok) {
    console.error(`Typesense health check failed: ${JSON.stringify(health)}`);
    process.exit(1);
  }
  if (deleteMode) {
    await deleteCollections(client, requested, host, skipPrompts);
    return;
  }

  console.info(
    `Connected to ${host} — provisioning ${targetSchemas.length} collection(s)${requested.length > 0 ? `: ${targetSchemas.map((s) => s.name).join(", ")}` : ""}${recreate ? " (recreate mode)" : ""}`,
  );

  // Destructive-action confirmation gate. --recreate drops + recreates every
  // targeted collection (which exists in the cluster), permanently deleting
  // all documents. Show the operator exactly which collections will be
  // affected and require an explicit "yes" before proceeding.
  // --skip-prompts bypasses the prompt for automation; a non-TTY context
  // (no stdin) fails closed unless --skip-prompts was passed.
  if (recreate && !skipPrompts) {
    const existing: string[] = [];
    for (const schema of targetSchemas) {
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
  for (const schema of targetSchemas) {
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
