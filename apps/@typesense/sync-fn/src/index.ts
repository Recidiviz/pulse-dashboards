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

import * as admin from "firebase-admin";
import { firestore } from "firebase-admin";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import type { Client as TypesenseClient } from "typesense";

import {
  createTypesenseClientFromEnv,
  type FirestoreDoc,
} from "~@typesense/client";

import {
  CLIENT_UPDATE_PATTERN,
  OPPORTUNITY_UPDATE_PATTERN,
  syncDocument,
} from "./sync";

// A single patch should fail fast rather than hold the trigger invocation open.
const CONNECTION_TIMEOUT_SECONDS = 10;

// Lazily constructed so module load doesn't fail when env vars are absent (e.g.
// under test), and so the client is reused across warm invocations.
let cachedClient: TypesenseClient | undefined;

function typesenseClient(): TypesenseClient {
  if (!cachedClient) {
    cachedClient = createTypesenseClientFromEnv(CONNECTION_TIMEOUT_SECONDS);
  }
  return cachedClient;
}

const database = process.env["FIRESTORE_DATABASE"] ?? "(default)";

admin.initializeApp();

// `firestore()` addresses the default database only. Reading the wrong one
// answers "does not exist" for every path, which this handler turns into a
// Typesense DELETE — the whole mirror, emptied quietly.
if (database !== "(default)") {
  throw new Error(
    `FIRESTORE_DATABASE is "${database}", but the re-read addresses the default ` +
      `database only. Give sync-fn a client that can name the database before ` +
      `pointing it at this one.`,
  );
}

type Snapshot = {
  exists: boolean;
  data: () => FirestoreDoc | undefined;
  ref: { path: string };
};

// The event name on the log entry written when a write does not reach
// Typesense. The typesense-sync alert policy in Terraform filters on it.
export const SYNC_FAILED_EVENT = "typesense_sync_failed";

/**
 * Returns the collection names in a document path, without the document ids,
 * e.g. "clientUpdatesV2/clientOpportunityUpdates".
 */
function collectionsInPath(path: string): string {
  return path
    .split("/")
    .filter((_, index) => index % 2 === 0)
    .join("/");
}

/** Returns message with each document id from path replaced by "<id>". */
function withoutDocIds(message: string, path: string): string {
  return path
    .split("/")
    .filter((_, index) => index % 2 === 1)
    .reduce(
      (redacted, id) =>
        redacted.replace(
          new RegExp(id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
          "<id>",
        ),
      message,
    );
}

/**
 * Writes one JSON log line, which Cloud Run parses into jsonPayload. The line
 * names collections but no document, because a document id holds a person's
 * external id.
 */
function reportSyncFailure(details: Record<string, unknown>): void {
  console.error(
    JSON.stringify({
      severity: "ERROR",
      event: SYNC_FAILED_EVENT,
      ...details,
    }),
  );
}

// The Terraform event_trigger is what actually binds these functions, but
// firebase-functions uses the `document` option to resolve the event's resource
// name — keep it identical to the match-path-pattern in main.tf.
//
// Logging is deliberately verbose: this is the only way to confirm a deployed
// sync actually fired, and which document it touched. One FIRE line per
// invocation, then one PATCH / UPSERT / DELETE / ABSENT / SKIP / NOOP line from
// syncDocument — the verb says which write mode the path took.
export async function handleWrite(
  before: Snapshot | undefined,
  after: Snapshot | undefined,
  eventTime?: string,
): Promise<void> {
  const snapshot = after ?? before;
  if (!snapshot) {
    // firebase-functions sets `data` to undefined when the raw CloudEvent has
    // no payload, which in practice means the handler wasn't invoked with a
    // CloudEvent at all. The usual cause is the function running in http
    // signature mode — see GOOGLE_FUNCTION_SIGNATURE_TYPE in the component's
    // build_config. Not retryable, so log and return rather than throw.
    reportSyncFailure({
      reason: "no_event_data",
      message:
        "event carried no document data — check that the function is " +
        "deployed with GOOGLE_FUNCTION_SIGNATURE_TYPE=cloudevent",
    });
    return;
  }

  const path = snapshot.ref.path;
  let change = "create";
  if (!after?.exists) change = "delete";
  else if (before?.exists) change = "update";

  const startedAt = Date.now();
  console.info(`[sync] FIRE  ${change} ${path}`);

  try {
    // READ, rather than trust the event's payload. The payload is the document
    // as of the write that fired it, and triggers are unordered, so an older
    // snapshot can arrive last.
    const current = await firestore().doc(path).get();
    const data = current.exists ? (current.data() as FirestoreDoc) ?? {} : null;
    const previousData = before?.exists ? before.data() ?? {} : null;

    if (Boolean(after?.exists) !== current.exists) {
      console.info(
        `[sync] STALE ${path} — event said exists=${String(Boolean(after?.exists))}, ` +
          `Firestore says exists=${String(current.exists)}; using Firestore`,
      );
    }

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
    // Rethrow so the trigger's retry policy retries the event. The alert
    // pages on eventAgeSeconds, so a failure that a retry fixes does not page.
    const error = err as Error & { httpStatus?: number };
    reportSyncFailure({
      reason: "sync_failed",
      change,
      collections: collectionsInPath(path),
      eventAgeSeconds: eventTime
        ? Math.round((Date.now() - Date.parse(eventTime)) / 1000)
        : null,
      errorType: error?.name ?? null,
      httpStatus: error?.httpStatus ?? null,
      message: withoutDocIds(
        err instanceof Error ? err.message : String(err),
        path,
      ),
    });
    throw err;
  }
}

export const syncClientUpdate = onDocumentWritten(
  { document: CLIENT_UPDATE_PATTERN, database },
  async (event) => {
    await handleWrite(event.data?.before, event.data?.after, event.time);
  },
);

export const syncClientOpportunityUpdate = onDocumentWritten(
  { document: OPPORTUNITY_UPDATE_PATTERN, database },
  async (event) => {
    await handleWrite(event.data?.before, event.data?.after, event.time);
  },
);
