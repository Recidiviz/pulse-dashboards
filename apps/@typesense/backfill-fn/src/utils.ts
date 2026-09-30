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

// The per-page steps of a backfill: project a Firestore doc, import a batch,
// and report a batch that threw.

import { composeDocIdFromFields, type FirestoreDoc } from "~@typesense/client";

import { projectFields } from "./projection";
import { parseImportResponse } from "./responses";
import type {
  MergeSet,
  Projection,
  RunContext,
  TypesenseImportError,
} from "./types";

export function projectWithMerges(
  data: FirestoreDoc,
  id: string,
  {
    fields,
    constantFields,
    derivedFields,
    referenceFields,
    transform,
  }: Projection,
  mergeSets: MergeSet[],
): FirestoreDoc {
  const projected = projectFields(
    data,
    fields,
    id,
    constantFields,
    derivedFields,
    referenceFields,
    transform,
  );

  // Merged fields win over the ETL projection: the officer's action is the
  // newer truth for the fields it owns.
  let merged: FirestoreDoc | undefined;
  for (const { source, docs } of mergeSets) {
    // No lookupKey: keyed by the target's own id. See MergeSource.
    const key = source.lookupKey
      ? composeDocIdFromFields(
          data,
          source.lookupKey.fields,
          source.lookupKey.lowercaseFields,
        )
      : id;
    const hit = key === undefined ? undefined : docs.get(key);
    if (hit) merged = { ...merged, ...hit };
  }
  // `id` re-applied last so a stray merge field can't clobber it, matching
  // projectFields' own protection.
  return merged ? { ...projected, ...merged, id } : projected;
}

export function reportBatchFailure(
  tag: string,
  batchSize: number,
  importErr: TypesenseImportError,
): void {
  console.error(
    `${tag} batch import threw (size=${batchSize}): ${importErr.message}`,
  );
  if (importErr.httpStatus) {
    console.error(`${tag} httpStatus=${importErr.httpStatus}`);
  }
  const results = Array.isArray(importErr.importResults)
    ? importErr.importResults
    : null;
  if (!results) return;

  // Counts by distinct error message — usually one or two unique reasons
  // dominate (a schema-constraint violation hitting every doc the same
  // way), and we get the answer without dumping 100 per-doc lines.
  const errorCounts = new Map<string, number>();
  for (const r of results) {
    if (r && r.success === false) {
      const key = r.error ?? "(no error message)";
      errorCounts.set(key, (errorCounts.get(key) ?? 0) + 1);
    }
  }
  console.error(
    `${tag} distinct error messages: ${[...errorCounts.entries()]
      .map(([msg, count]) => `${count}× "${msg}"`)
      .join("; ")}`,
  );
  // First 3 failed entries with their projected docs — for when the
  // counts alone don't pin it down (multiple distinct errors).
  const samples = results
    .filter((r): r is { success: false; error?: string } => r.success === false)
    .slice(0, 3);
  for (const r of samples) {
    console.error(`${tag} sample failure: ${JSON.stringify(r)}`);
  }
}

export async function importBatch(
  { client, limiter }: RunContext,
  name: string,
  docs: FirestoreDoc[],
  tag: string,
): Promise<{ imported: number; failed: number }> {
  let imported = 0;
  let failed = 0;

  try {
    // Gate every import through the shared limiter so the combined request
    // rate across all concurrent collections doesn't overwhelm the shared
    // Typesense cluster (which also serves live search). No-op when disabled.
    await limiter.take();

    // Typesense bulk import returns per-doc results — a 200 on the request as
    // a whole still has individual `success` booleans per doc.
    const raw = await client
      .collections(name)
      .documents()
      .import(docs, { action: "upsert" });

    for (const entry of parseImportResponse(raw)) {
      if (entry.success) {
        imported += 1;
      } else {
        failed += 1;
        console.warn(
          `${tag} doc import failed: ${entry.error ?? JSON.stringify(entry)}`,
        );
      }
    }
  } catch (err) {
    // Whole-batch failure. The Typesense client throws when EVERY doc in
    // the bulk fails (vs returning per-line successes when some succeed)
    // and tucks the per-doc reasons onto `err.importResults`. Surface a
    // summary of those reasons so Cloud Logging shows why, not just that.
    failed += docs.length;
    reportBatchFailure(tag, docs.length, err as TypesenseImportError);
  }

  return { imported, failed };
}
