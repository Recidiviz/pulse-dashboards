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
      responder(res)(null, { ok: true });
      return;
    }
    responder(res)({ status: 503, errors: ["Typesense reported unhealthy"] });
  } catch (error) {
    responder(res)({
      status: 503,
      errors: [error?.message || "Typesense is unreachable"],
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
