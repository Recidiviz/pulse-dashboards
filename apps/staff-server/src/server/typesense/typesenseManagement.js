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
 * Route handlers backing the "Typesense Management" section of the staff profile
 * page. They expose read-only introspection of the Typesense cluster this
 * deployment is wired to (staging or production), mirroring the CLI in
 * libs/@typesense/client/src/inspect.ts.
 *
 * Access is restricted to Recidiviz internal users
 */
import { responder, respondWithForbidden, serviceAccount } from "../routes/api";
import { getAppMetadata } from "../utils/getAppMetadata";
import { isOfflineMode } from "../utils/isOfflineMode";
import unauthorizedCollectionsFixture from "./__fixtures__/unauthorized-collections.json";
import unauthorizedSchemasFixture from "./__fixtures__/unauthorized-schemas.json";
import unconfiguredHealthFixture from "./__fixtures__/unconfigured-health.json";
import unreachableHealthFixture from "./__fixtures__/unreachable-health.json";
import {
  createTypesenseBackfillClient,
  createTypesenseInspectClient,
} from "./client";

function isAllowed(req) {
  const appMetadata = getAppMetadata(req);
  return appMetadata.state_code === "recidiviz" || isOfflineMode();
}

/**
 * GET /api/typesense/health
 *
 * Reports whether the Typesense cluster this deployment is wired to is
 * reachable and healthy. Backs the management section's connection indicator.
 * Returns 200 `{ ok: true }` when healthy; 503 `{ ok: false }` when the cluster
 * is unreachable or reports unhealthy, so the UI can distinguish "down" from a
 * forbidden/misconfigured response.
 */
export async function typesenseHealth(req, res) {
  if (!isAllowed(req)) {
    respondWithForbidden(res);
    return;
  }

  const host = process.env.TYPESENSE_HOST ?? null;

  // For testing: set TYPESENSE_SIMULATE to force a response without hitting
  // the cluster. Each value is scoped to the endpoint it names — setting one
  // only affects that endpoint's handler, so failure modes can be tested in
  // isolation; every other handler falls through to its real Typesense call.
  // Failure-mode values are backed by fixtures captured from a real local
  // Typesense instance (see captureTypesenseSimulateFixtures.ts)
  //   health-unconfigured — health 500 (TYPESENSE_HOST unset)
  //   health-unreachable  — health 503 (cluster unreachable)
  //   health-unhealthy    — health 503 (cluster reports unhealthy)
  const simulate = process.env.TYPESENSE_SIMULATE;
  if (simulate === "health-unconfigured") {
    res
      .status(unconfiguredHealthFixture.status)
      .send(unconfiguredHealthFixture.body);
    return;
  }
  if (simulate === "health-unreachable") {
    res
      .status(unreachableHealthFixture.status)
      .send({ ...unreachableHealthFixture.body, host });
    return;
  }
  if (simulate === "health-unhealthy") {
    res.status(503).send({
      status: 503,
      errors: ["Typesense reported unhealthy"],
      host,
    });
    return;
  }

  let client;
  try {
    client = createTypesenseInspectClient();
  } catch (error) {
    responder(res)(error);
    return;
  }

  try {
    const health = await client.health.retrieve();
    if (health?.ok) {
      responder(res)(null, { ok: true, host });
      return;
    }
    res.status(503).send({
      status: 503,
      errors: ["Typesense reported unhealthy"],
      host,
    });
  } catch (error) {
    res.status(503).send({
      status: 503,
      errors: [error?.message || "Typesense is unreachable"],
      host,
    });
  }
}

/**
 * GET /api/typesense/collections
 *
 * Returns a summary of every collection in the cluster: name, document count,
 * field count, and creation time. Backs the management section's overview list.
 *
 * For testing: TYPESENSE_SIMULATE=collections-empty returns an empty list;
 * TYPESENSE_SIMULATE=collections-unauthorized returns a 401 error.
 */
export async function typesenseCollectionsSummary(req, res) {
  if (!isAllowed(req)) {
    respondWithForbidden(res);
    return;
  }

  if (process.env.TYPESENSE_SIMULATE === "collections-empty") {
    responder(res)(null, []);
    return;
  }

  if (process.env.TYPESENSE_SIMULATE === "collections-unauthorized") {
    res
      .status(unauthorizedCollectionsFixture.status)
      .send(unauthorizedCollectionsFixture.body);
    return;
  }

  try {
    const client = createTypesenseInspectClient();
    const collections = await client.collections().retrieve();
    const summary = collections.map((collection) => ({
      name: collection.name,
      numDocuments: collection.num_documents,
      numFields: collection.fields?.length ?? 0,
      defaultSortingField: collection.default_sorting_field || null,
      createdAt: collection.created_at ?? null,
    }));
    responder(res)(null, summary);
  } catch (error) {
    responder(res)(error);
  }
}

/**
 * GET /api/typesense/schemas
 *
 * Returns all collection schemas (fields, document count, etc.) keyed by
 * collection name, in a single request.
 *
 * For testing: TYPESENSE_SIMULATE=schemas-empty returns an empty object;
 * TYPESENSE_SIMULATE=schemas-unauthorized returns a 401 error.
 */
export async function typesenseAllCollectionsSchemas(req, res) {
  if (!isAllowed(req)) {
    respondWithForbidden(res);
    return;
  }

  if (process.env.TYPESENSE_SIMULATE === "schemas-empty") {
    responder(res)(null, {});
    return;
  }

  if (process.env.TYPESENSE_SIMULATE === "schemas-unauthorized") {
    res
      .status(unauthorizedSchemasFixture.status)
      .send(unauthorizedSchemasFixture.body);
    return;
  }

  try {
    const client = createTypesenseInspectClient();
    const collections = await client.collections().retrieve();
    const schemas = Object.fromEntries(collections.map((c) => [c.name, c]));
    responder(res)(null, schemas);
  } catch (error) {
    responder(res)(error);
  }
}

/**
 * Validates the POST /api/typesense/backfill body, which is optional and if
 * present must be `{ collections?: string[] }`. Returns `{ error }` for any
 * malformed body so the route can reject with a 400 before invoking the
 * Cloud Function.
 */
function parseBackfillBody(body) {
  if (body === undefined || body === null) return {};
  if (typeof body !== "object" || Array.isArray(body)) {
    return { error: "body must be an object" };
  }
  const { collections } = body;
  if (collections === undefined) return {};
  if (!Array.isArray(collections)) {
    return { error: "`collections` must be an array of strings" };
  }
  if (!collections.every((c) => typeof c === "string" && c.length > 0)) {
    return { error: "`collections` entries must be non-empty strings" };
  }
  return { collections };
}

/**
 * POST /api/typesense/backfill
 *
 * Triggers the `typesense-backfill` Cloud Function, which bulk-imports the
 * configured Firestore collections into Typesense. Accepts an optional
 * `{ collections: string[] }` body to backfill only a subset; omit to
 * backfill everything the function is configured for.
 */
export async function typesenseBackfill(req, res) {
  if (!isAllowed(req)) {
    respondWithForbidden(res);
    return;
  }

  const parsed = parseBackfillBody(req.body);
  if ("error" in parsed) {
    res.status(400).send({ status: 400, errors: [parsed.error] });
    return;
  }

  try {
    const { url, idTokenClient } = await createTypesenseBackfillClient({
      credentials: serviceAccount,
    });
    const data = {};
    if (parsed.collections) {
      data.collections = parsed.collections;
    }
    const response = await idTokenClient.request({
      url,
      method: "POST",
      data,
    });
    responder(res)(null, response.data);
  } catch (error) {
    responder(res)(error);
  }
}
