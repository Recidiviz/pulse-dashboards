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

/* eslint-disable no-console -- a report script; its output IS the result */

/** **************************************************
 * Repairs `stateCode` on every clientOpportunityUpdates document.
 *
 * Sample commands:
 * nx backfill-opportunity-update-state-codes staff -c staging
 * nx backfill-opportunity-update-state-codes staff -c staging --apply
 * nx backfill-opportunity-update-state-codes staff -c production --apply
 *
 * Without --apply it reads and reports, and writes nothing.
 *************************************************** */

import { Firestore } from "@google-cloud/firestore";
import inquirer from "inquirer";

import { FIRESTORE_GENERAL_COLLECTION_MAP } from "~firestore-config";

// Two defects, and both make a document invisible rather than malformed:
//
//   MISSING    `stateCode` was optional on the schema, and the writer set it
//              on the PERSON document rather than this subdocument. The
//              Typesense import requires it, so those updates never reached
//              the index and their records stayed on the tab they would
//              occupy untouched. `getOpportunityUpdatesByReviewerId` filters
//              on it too, so the supervisor-review flow could not see them.
//
//   WRONG CASE `recordId.slice(0, 5)` yields `us_mi`, while every reader uses
//              `US_MI`. Such a document imports cleanly and then matches no
//              query. Harder to notice than a missing one, because nothing is
//              absent.
//
// The state comes from the PARENT document id, which the ETL files as
// `us_xx_<externalId>` — never from the subdocument, which is what is being
// repaired. A parent id of another shape is reported and skipped, not guessed.

const env = process.env.NX_TASK_TARGET_CONFIGURATION;
/**
 * Whether the named flag is on the command line. The caller passes the name
 * without the dashes, so hasFlag("apply") tests for --apply.
 */
function hasFlag(name: string): boolean {
  const arg = process.argv.find(
    (a) => a === `--${name}` || a.startsWith(`--${name}=`),
  );
  if (arg === undefined) return false;
  const value = arg.split("=")[1];
  return value === undefined || !["false", "0"].includes(value.toLowerCase());
}

const apply = hasFlag("apply");

if (!env) {
  throw new Error(
    "NX_CONFIGURATION not set. Run with -c staging or -c production",
  );
}

function getFirebaseSettings() {
  const credentialsJson = process.env.FIREBASE_CREDENTIAL_JSON;
  if (!credentialsJson) {
    throw new Error("FIREBASE_CREDENTIAL_JSON environment variable not set");
  }

  const credentials = JSON.parse(credentialsJson);

  if (env === "staging")
    return { projectId: "recidiviz-dashboard-staging", credentials };
  if (env === "production")
    return { projectId: "recidiviz-dashboard-production", credentials };
  throw new Error(`Unknown environment ${env}`);
}

// Firestore caps a batch at 500 writes.
const BATCH_SIZE = 400;

export type Verdict = "ok" | "missing" | "wrongCase" | "unresolvable";

/**
 * The state a person record id belongs to, in the `US_XX` form every reader
 * uses.
 *
 * Kept here rather than imported from `~@typesense/client`, which has its own
 * copy: that one is a FALLBACK for data this script exists to repair, so this
 * must not silently inherit a change to it. A test asserts the two agree.
 */
export function stateCodeFromRecordId(recordId: string): string | undefined {
  const match = /^([A-Za-z]{2})_([A-Za-z]{2})_/.exec(recordId);
  return match ? `${match[1]}_${match[2]}`.toUpperCase() : undefined;
}

/** What is wrong with this document's `stateCode`, if anything. */
export function classify(
  current: unknown,
  expected: string | undefined,
): Verdict {
  if (expected === undefined) return "unresolvable";
  if (typeof current !== "string" || current === "") return "missing";
  return current === expected ? "ok" : "wrongCase";
}

type Tally = Record<Verdict, number>;

const emptyTally = (): Tally => ({
  ok: 0,
  missing: 0,
  wrongCase: 0,
  unresolvable: 0,
});

async function main(): Promise<void> {
  const db = new Firestore(getFirebaseSettings());
  const subcollection =
    FIRESTORE_GENERAL_COLLECTION_MAP.clientOpportunityUpdates;

  console.log(`${apply ? "APPLYING" : "DRY RUN"} — ${subcollection} in ${env}`);

  // `select` with no argument returns id-only documents, which would drop the
  // one field this needs, so it is named.
  const snapshot = await db
    .collectionGroup(subcollection)
    .select("stateCode")
    .get();

  const byState = new Map<string, Tally>();
  const repairs: { ref: FirebaseFirestore.DocumentReference; to: string }[] =
    [];

  for (const doc of snapshot.docs) {
    // The PARENT is the person document and its id carries the state. The
    // subdocument's own id is the opportunity type.
    const expected = stateCodeFromRecordId(doc.ref.parent.parent?.id ?? "");
    const verdict = classify(doc.get("stateCode"), expected);

    const key = expected ?? "(unresolvable)";
    const tally = byState.get(key) ?? emptyTally();
    tally[verdict] += 1;
    byState.set(key, tally);

    if (expected && verdict !== "ok")
      repairs.push({ ref: doc.ref, to: expected });
  }

  console.log("");
  console.log(
    `  ${"STATE".padEnd(18)}${"OK".padStart(9)}${"MISSING".padStart(9)}${"WRONG CASE".padStart(12)}`,
  );
  console.log(`  ${"-".repeat(48)}`);
  for (const [state, tally] of [...byState].sort()) {
    console.log(
      `  ${state.padEnd(18)}${String(tally.ok).padStart(9)}` +
        `${String(tally.missing).padStart(9)}${String(tally.wrongCase).padStart(12)}`,
    );
  }

  const unresolvable = byState.get("(unresolvable)")?.unresolvable ?? 0;
  console.log("");
  console.log(`  documents read : ${snapshot.size}`);
  console.log(`  to repair      : ${repairs.length}`);
  if (unresolvable > 0) {
    console.log(
      `  SKIPPED        : ${unresolvable} whose parent id is not \`us_xx_...\`. ` +
        `Not guessed at; investigate separately.`,
    );
  }
  console.log("");

  if (repairs.length === 0) return console.log("Nothing to repair.");
  if (!apply) {
    return console.log("Dry run — nothing written. Re-run with --apply.");
  }

  const { shouldContinue } = await inquirer.prompt({
    type: "confirm",
    name: "shouldContinue",
    message: `Write stateCode to ${repairs.length} document(s) in ${env}. Continue?`,
    default: false,
  });
  if (!shouldContinue) return console.log("Aborted. Nothing was written.");

  // `update`, not `set(..., { merge: true })`: a document deleted since the
  // read should fail rather than be recreated by this script.
  const batches: (typeof repairs)[] = [];
  for (let i = 0; i < repairs.length; i += BATCH_SIZE) {
    batches.push(repairs.slice(i, i + BATCH_SIZE));
  }

  let written = 0;
  for (const chunk of batches) {
    const batch = db.batch();
    chunk.forEach(({ ref, to }) => batch.update(ref, { stateCode: to }));
    // Batches commit in sequence on purpose: firing them all at once
    // exhausts the connection pool.
    // eslint-disable-next-line no-await-in-loop
    await batch.commit();
    written += chunk.length;
    console.log(`  committed ${written}/${repairs.length}`);
  }

  console.log("");
  console.log(`Repaired ${written} document(s).`);
  console.log(
    "Re-run the opportunityUpdates backfill so Typesense picks them up.",
  );
}

main().catch((error) => {
  console.log(error);
  process.exitCode = 1;
});
