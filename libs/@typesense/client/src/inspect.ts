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

// Read-only introspection of a remote Typesense cluster. Three subcommands:
//   list                    Print collection names, one per line.
//   summary                 Print names + doc counts + field counts.
//   schema --collection=X   Print the full field schema for collection X.
//
// Reads TYPESENSE_HOST and TYPESENSE_API_INSPECT_KEY from the environment (typically
// loaded by the SOPS plugin from env.<env>.enc.yaml). Admin key is required so the
// script can hit `/collections` endpoints (the search-only TYPESENSE_API_KEY used by
// client.ts would 401 here). No writes — safe to run against any cluster.

import { createTypesenseClient } from "./client";

type Subcommand = "list" | "summary" | "schema";

function isSubcommand(value: string): value is Subcommand {
  return value === "list" || value === "summary" || value === "schema";
}

function printTable(rows: Array<Record<string, string | number>>): void {
  if (rows.length === 0) {
    console.info("(no rows)");
    return;
  }
  const keys = Object.keys(rows[0]);
  const widths = keys.map((k) =>
    Math.max(k.length, ...rows.map((r) => String(r[k]).length)),
  );
  const formatRow = (cells: string[]) =>
    cells.map((c, i) => c.padEnd(widths[i])).join("  ");
  console.info(formatRow(keys));
  console.info(formatRow(widths.map((w) => "-".repeat(w))));
  for (const r of rows) {
    console.info(formatRow(keys.map((k) => String(r[k]))));
  }
}

function parseCollectionArg(): string | undefined {
  // Accept either `--collection=foo` or `--collection foo`.
  for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith("--collection="))
      return arg.slice("--collection=".length);
    if (arg === "--collection") return process.argv[i + 1];
  }
  return undefined;
}

async function main(): Promise<void> {
  const host = process.env["TYPESENSE_HOST"];
  const apiKey = process.env["TYPESENSE_API_INSPECT_KEY"];
  if (!host) {
    console.error("TYPESENSE_HOST is required");
    process.exit(1);
  }
  if (!apiKey) {
    console.error("TYPESENSE_API_INSPECT_KEY is required");
    process.exit(1);
  }

  const subcommand = process.argv[2];
  if (!subcommand || !isSubcommand(subcommand)) {
    console.error(
      `Usage: tsx src/inspect.ts <list|summary|schema> [--collection=<name>]`,
    );
    process.exit(1);
  }

  const client = createTypesenseClient({ host, apiKey });

  if (subcommand === "list") {
    const collections = await client.collections().retrieve();
    for (const c of collections) console.info(c.name);
    return;
  }

  if (subcommand === "summary") {
    const collections = await client.collections().retrieve();
    const rows = collections.map((c) => ({
      name: c.name,
      docs: c.num_documents,
      fields: c.fields?.length ?? 0,
    }));
    printTable(rows);
    return;
  }

  // schema
  const collection = parseCollectionArg();
  if (!collection) {
    console.error(
      "schema requires --collection=<name>, e.g. --collection=supervisionStaff",
    );
    process.exit(1);
  }
  const result = await client.collections(collection).retrieve();
  console.info(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
});
