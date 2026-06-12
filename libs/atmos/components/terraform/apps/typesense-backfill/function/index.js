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

const functions = require("@google-cloud/functions-framework");
const admin = require("firebase-admin");

const { runBackfill } = require("./backfill");

// Init only once per cold start. The default app reads the configured
// Firestore database from process.env.FIRESTORE_DATABASE when set;
// `(default)` is the project's default DB.
admin.initializeApp();

functions.http("backfill", async (req, res) => {
  const startedAt = Date.now();

  let allCollections;
  try {
    allCollections = JSON.parse(process.env.COLLECTIONS_JSON || "[]");
  } catch (err) {
    res.status(500).json({
      error: "COLLECTIONS_JSON env var is not valid JSON",
      detail: err.message,
    });
    return;
  }

  // Optional per-invocation filter: POST `{ "collections": ["clients"] }` to
  // backfill only a subset. Omit to backfill everything in COLLECTIONS_JSON.
  const filter = Array.isArray(req.body && req.body.collections)
    ? new Set(req.body.collections)
    : null;
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

  console.info(`[backfill] starting: ${targets.map((c) => c.name).join(", ")}`);

  try {
    const result = await runBackfill(targets);
    const durationMs = Date.now() - startedAt;
    console.info(`[backfill] complete in ${durationMs}ms`, result);
    res.status(200).json({ durationMs, ...result });
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    console.error(`[backfill] failed after ${durationMs}ms`, err);
    res.status(500).json({
      error: err.message,
      stack: err.stack,
      durationMs,
    });
  }
});
