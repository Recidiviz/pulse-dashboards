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

// Trigger wiring for the Firestore→Typesense realtime sync. Two entry points,
// one bundle — both are deployed by libs/atmos/components/terraform/apps/typesense-sync
// as separate Cloud Functions v2 resources reading the same source zip, since a
// CFv2 function can carry only one trigger.
//
// The handlers are thin: all projection and id composition lives in sync.ts, so
// the interesting logic is unit-testable without a Firestore event.
//
// `onDocumentWritten` fires on create, update AND delete. A delete arrives with
// `event.data.after.exists === false`, which sync.ts turns into a Typesense
// delete.

import { onDocumentWritten } from "firebase-functions/v2/firestore";
import type { Client as TypesenseClient } from "typesense";

import { createTypesenseClient } from "~@typesense/client";

import {
  CLIENT_UPDATE_PATTERN,
  FirestoreDoc,
  OPPORTUNITY_UPDATE_PATTERN,
  syncDocument,
} from "./sync";

// Lazily constructed so module load doesn't fail when env vars are absent (e.g.
// under test), and so the client is reused across warm invocations.
let cachedClient: TypesenseClient | undefined;

function typesenseClient(): TypesenseClient {
  if (!cachedClient) {
    // Same three-var contract the backfill function uses, mirroring what the
    // extension established and what the Terraform sets.
    const host = `${process.env["TYPESENSE_PROTOCOL"]}://${process.env["TYPESENSE_HOSTS"]}:${process.env["TYPESENSE_PORT"]}`;
    cachedClient = createTypesenseClient({
      host,
      apiKey: process.env["TYPESENSE_API_KEY"] ?? "",
      connectionTimeoutSeconds: 10,
    });
  }
  return cachedClient;
}

const database = process.env["FIRESTORE_DATABASE"] ?? "(default)";

type Snapshot = {
  exists: boolean;
  data: () => FirestoreDoc | undefined;
  ref: { path: string };
};

// The Terraform event_trigger is what actually binds these functions, but
// firebase-functions uses the `document` option to resolve the event's resource
// name — keep it identical to the match-path-pattern in main.tf.
//
// Logging is deliberately verbose: this is the only way to confirm a deployed
// sync actually fired, and which document it touched. One FIRE line per
// invocation, then one PATCH / ABSENT / SKIP / NOOP line from syncDocument.
async function handleWrite(
  before: Snapshot | undefined,
  after: Snapshot | undefined,
): Promise<void> {
  const snapshot = after ?? before;
  if (!snapshot) {
    // firebase-functions sets `data` to undefined when the raw CloudEvent has
    // no payload, which in practice means the handler wasn't invoked with a
    // CloudEvent at all. The usual cause is the function running in http
    // signature mode — see GOOGLE_FUNCTION_SIGNATURE_TYPE in the component's
    // build_config. Not retryable, so log and return rather than throw.
    console.error(
      "[sync] FIRE  event carried no document data — check that the function " +
        "is deployed with GOOGLE_FUNCTION_SIGNATURE_TYPE=cloudevent",
    );
    return;
  }

  const path = snapshot.ref.path;
  let change = "create";
  if (!after?.exists) change = "delete";
  else if (before?.exists) change = "update";

  const startedAt = Date.now();
  console.info(`[sync] FIRE  ${change} ${path}`);

  const data = after?.exists ? after.data() ?? {} : null;
  const previousData = before?.exists ? before.data() ?? {} : null;
  try {
    const result = await syncDocument(
      typesenseClient(),
      path,
      data,
      previousData,
    );
    console.info(
      `[sync] DONE  ${change} ${path} → ${result.status} in ${Date.now() - startedAt}ms`,
    );
  } catch (err) {
    // Rethrow so the trigger's retry policy sees the failure; log first so the
    // failing document is identifiable without decoding the retry.
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[sync] FAIL  ${change} ${path}: ${message}`);
    throw err;
  }
}

export const syncClientUpdate = onDocumentWritten(
  { document: CLIENT_UPDATE_PATTERN, database },
  async (event) => {
    await handleWrite(event.data?.before, event.data?.after);
  },
);

export const syncClientOpportunityUpdate = onDocumentWritten(
  { document: OPPORTUNITY_UPDATE_PATTERN, database },
  async (event) => {
    await handleWrite(event.data?.before, event.data?.after);
  },
);
