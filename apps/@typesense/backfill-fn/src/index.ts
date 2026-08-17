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

// HTTP entry point for the typesense-backfill Cloud Function.
//
// Exported as the named `backfill` so CFv2's buildpack discovers it directly —
// no @google-cloud/functions-framework registration required. The TF resource's
// `entry_point = "backfill"` points at this export.
//
// Adapted from the upstream firestore-typesense-search extension's backfill
// function (https://github.com/typesense/firestore-typesense-search/blob/9f6343eefa6d5cf42747db84368c770e85de7241/functions/src/backfill.js).
// Differences vs the extension:
//   - HTTP-triggered (not Firestore-doc-triggered), so it can be invoked by
//     Cloud Scheduler on a cron, or manually via curl.
//   - Collection set is fixed at deploy-time via the COLLECTIONS_JSON env var
//     (sourced from TF). Specific collections can be selected per-invocation
//     by passing `{ "collections": ["clients", "residents"] }` in the body.
//   - No backfill-doc-status writeback; the function just returns a JSON
//     summary in the HTTP response.

import type { Request, Response } from "express";
import * as admin from "firebase-admin";

import {
  type CollectionConfig,
  isValidStateCode,
  runBackfill,
} from "./backfill";

// Init only once per cold start. The default app reads the configured
// Firestore database from process.env.FIRESTORE_DATABASE when set;
// `(default)` is the project's default DB.
admin.initializeApp();

function parseCollectionsJson(): CollectionConfig[] | { error: string } {
  const raw = process.env["COLLECTIONS_JSON"] ?? "[]";
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { error: "COLLECTIONS_JSON is not an array" };
    }
    return parsed as CollectionConfig[];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: `COLLECTIONS_JSON env var is not valid JSON: ${message}` };
  }
}

function extractFilter(body: unknown): Set<string> | null {
  if (!body || typeof body !== "object") return null;
  const collections = (body as { collections?: unknown }).collections;
  if (!Array.isArray(collections)) return null;
  return new Set(collections.filter((c): c is string => typeof c === "string"));
}

// Optional per-invocation state scope. Returns `{}` when no `stateCode` was sent
// (whole-collection run), `{ stateCode }` for a valid one, or `{ error }` when
// the caller sent a malformed value. A malformed value is an ERROR, not a silent
// whole-collection fallback: the prune deletes everything out of scope, so
// degrading a per-state request to whole-collection could wipe every other
// state's docs.
function extractStateCode(
  body: unknown,
): { stateCode?: string } | { error: string } {
  if (!body || typeof body !== "object") return {};
  const raw = (body as { stateCode?: unknown }).stateCode;
  if (raw === undefined || raw === null) return {};
  const trimmed = typeof raw === "string" ? raw.trim() : raw;
  if (!isValidStateCode(trimmed)) {
    return { error: `invalid stateCode: ${JSON.stringify(raw)}` };
  }
  return { stateCode: trimmed };
}

// Optional per-invocation Firestore source-collection name, used to instantiate
// the `opportunities` template config.
function extractSourceCollection(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const raw = (body as { sourceCollection?: unknown }).sourceCollection;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function backfill(req: Request, res: Response): Promise<void> {
  const startedAt = Date.now();

  const parsed = parseCollectionsJson();
  if ("error" in parsed) {
    res.status(500).json({ error: parsed.error });
    return;
  }
  const allCollections = parsed;

  // Optional per-invocation filter: POST `{ "collections": ["clients"] }` to
  // backfill only a subset. Omit to backfill everything in COLLECTIONS_JSON.
  const filter = extractFilter(req.body);
  const targets = filter
    ? allCollections.filter((c) => filter.has(c.name))
    : allCollections;

  if (!targets.length) {
    res.status(400).json({
      error: filter
        ? `No matching collections in COLLECTIONS_JSON for filter: ${[...filter].join(",")}`
        : "COLLECTIONS_JSON is empty — nothing to backfill",
    });
    return;
  }

  // Optional per-invocation state scope: POST `{ "stateCode": "US_XX" }` to
  // reconcile only that state (both the import and the prune are filtered to it).
  // The ETL trigger fires per state, so this is the common path.
  const stateResult = extractStateCode(req.body);
  if ("error" in stateResult) {
    res.status(400).json({ error: stateResult.error });
    return;
  }
  const { stateCode } = stateResult;

  // Optional per-invocation source: POST `{ "sourceCollection":
  // "US_XX-<opportunity>Referrals" }`. The opportunity ETL trigger fires per
  // source, so this is the common path for `collections: ["opportunities"]`.
  const sourceCollection = extractSourceCollection(req.body);

  console.info(
    `[backfill] starting${stateCode ? ` (state=${stateCode})` : ""}${sourceCollection ? ` (source=${sourceCollection})` : ""}: ${targets
      .map((c) => c.name)
      .join(", ")}`,
  );

  try {
    const result = await runBackfill(targets, stateCode, sourceCollection);
    const durationMs = Date.now() - startedAt;
    console.info(
      `[backfill] complete${stateCode ? ` (state=${stateCode})` : ""}${sourceCollection ? ` (source=${sourceCollection})` : ""} in ${durationMs}ms`,
      result,
    );
    res.status(200).json({
      durationMs,
      stateCode: stateCode ?? null,
      sourceCollection: sourceCollection ?? null,
      ...result,
    });
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(
      `[backfill] failed${stateCode ? ` (state=${stateCode})` : ""} after ${durationMs}ms`,
      err,
    );
    res.status(500).json({ error: message, stack, durationMs });
  }
}
