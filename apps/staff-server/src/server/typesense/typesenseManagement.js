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
 * Access is restricted to Recidiviz internal users (or offline mode).
 */
import { responder, respondWithForbidden } from "../routes/api";
import { getAppMetadata } from "../utils/getAppMetadata";
import { isOfflineMode } from "../utils/isOfflineMode";
import notFoundSchemaFixture from "./__fixtures__/not-found-schema.json";
import unauthorizedCollectionsFixture from "./__fixtures__/unauthorized-collections.json";
import unauthorizedSchemaFixture from "./__fixtures__/unauthorized-schema.json";
import unconfiguredHealthFixture from "./__fixtures__/unconfigured-health.json";
import unreachableHealthFixture from "./__fixtures__/unreachable-health.json";
import { createTypesenseInspectClient } from "./client";

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
  // the cluster. Failure-mode values are backed by fixtures captured from a
  // real local Typesense instance (see captureTypesenseSimulateFixtures.ts)
  // rather than hand-typed guesses.
  //   no-collections — health OK; collections returns an empty list
  //   unauthorized   — health OK (Typesense's own /health doesn't require
  //                    auth); collections/schema return a 401 error
  //   not-found      — health OK; schema returns a 404 error
  //   unconfigured   — health 500 (collections/schema never called)
  //   unreachable    — health 503 (collections/schema never called)
  const simulate = process.env.TYPESENSE_SIMULATE;
  if (simulate) {
    if (
      simulate === "no-collections" ||
      simulate === "unauthorized" ||
      simulate === "not-found"
    ) {
      responder(res)(null, { ok: true, host });
    } else if (simulate === "unconfigured") {
      res
        .status(unconfiguredHealthFixture.status)
        .send(unconfiguredHealthFixture.body);
    } else if (simulate === "unreachable") {
      res
        .status(unreachableHealthFixture.status)
        .send({ ...unreachableHealthFixture.body, host });
    } else {
      res.status(503).send({
        status: 503,
        errors: ["Typesense reported unhealthy"],
        host,
      });
    }
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
 */
export async function typesenseCollectionsSummary(req, res) {
  if (!isAllowed(req)) {
    respondWithForbidden(res);
    return;
  }

  if (process.env.TYPESENSE_SIMULATE === "no-collections") {
    responder(res)(null, []);
    return;
  }

  if (process.env.TYPESENSE_SIMULATE === "unauthorized") {
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
 * GET /api/typesense/collections/:collectionName
 *
 * Returns the full schema (fields, document count, default sorting field, etc.)
 * for a single collection. Backs the management section's schema detail view.
 */
export async function typesenseCollectionSchema(req, res) {
  if (!isAllowed(req)) {
    respondWithForbidden(res);
    return;
  }

  const { collectionName } = req.params;

  if (process.env.TYPESENSE_SIMULATE === "unauthorized") {
    res
      .status(unauthorizedSchemaFixture.status)
      .send(unauthorizedSchemaFixture.body);
    return;
  }

  if (process.env.TYPESENSE_SIMULATE === "not-found") {
    res.status(notFoundSchemaFixture.status).send(notFoundSchemaFixture.body);
    return;
  }

  try {
    const client = createTypesenseInspectClient();
    const schema = await client.collections(collectionName).retrieve();
    responder(res)(null, schema);
  } catch (error) {
    // Typesense returns a 404 (ObjectNotFound) for unknown collections; surface
    // it as-is rather than a generic 500.
    if (error?.httpStatus === 404) {
      responder(res)(
        {
          status: 404,
          errors: [`Typesense collection not found: ${collectionName}`],
        },
        null,
      );
      return;
    }
    responder(res)(error);
  }
}
