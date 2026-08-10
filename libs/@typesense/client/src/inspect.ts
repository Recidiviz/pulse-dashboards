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
// Run with --help (or `<subcommand> --help`) for the full usage reference.
//
// Reads TYPESENSE_HOST and TYPESENSE_API_INSPECT_KEY from the environment (typically
// loaded by the SOPS plugin from env.<env>.enc.yaml). Admin key is required so the
// script can hit `/collections` endpoints (the search-only TYPESENSE_API_SEARCH_KEY
// used by client.ts would 401 here). No writes — safe to run against any cluster.

import { Command } from "@commander-js/extra-typings";

import { createTypesenseClient } from "./client";

// Env is read lazily, per subcommand, so `--help` works without a configured
// cluster.
function createInspectClient() {
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
  return createTypesenseClient({ host, apiKey });
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

const program = new Command()
  .name("inspect")
  .description("Read-only introspection of a remote Typesense cluster");

program
  .command("list")
  .description("Print collection names, one per line")
  .action(async () => {
    const collections = await createInspectClient().collections().retrieve();
    for (const c of collections) console.info(c.name);
  });

program
  .command("summary")
  .description("Print collection names with document and field counts")
  .action(async () => {
    const collections = await createInspectClient().collections().retrieve();
    printTable(
      collections.map((c) => ({
        name: c.name,
        docs: c.num_documents,
        fields: c.fields?.length ?? 0,
      })),
    );
  });

program
  .command("schema")
  .description("Print the full field schema for a collection")
  .requiredOption("--collection <name>", "Collection to describe")
  .action(async (options) => {
    // The nx target substitutes `--collection={args.collection}`, which yields
    // an empty value rather than an absent flag when the caller omits it — so
    // commander's required-option check alone isn't enough here.
    const collection = options.collection.trim();
    if (!collection) {
      console.error(
        "schema requires --collection=<name>, e.g. --collection=supervisionStaff",
      );
      process.exit(1);
    }
    const result = await createInspectClient()
      .collections(collection)
      .retrieve();
    console.info(JSON.stringify(result, null, 2));
  });

program.parseAsync().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
});
