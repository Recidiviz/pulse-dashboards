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
 * Cloud Run Job entry: sweep DRAFT intake shells and PENDING documents that
 * were orphaned by a killed process rather than a normal failure path.
 * Logs counts only; never form data, object keys, or other PII.
 */

import { captureMessage } from "@sentry/node";

import { getPrismaClientForStateCode } from "~@idaho-th/prisma";
import { runJobEntryPoint } from "~@idaho-th/server/jobs/runJobEntryPoint";
import { IDAHO_TH_STATE_CODE } from "~@idaho-th/trpc/auth/constants";
import { runDocumentJanitor } from "~@idaho-th/trpc/documentJanitor/documentJanitor.service";
import { ensureGcsStorageInitialized } from "~@idaho-th/trpc/storage/gcs";

const DOCUMENT_JANITOR_JOB_LOG = {
  JOB: "document-janitor",
  EVENT_START: "start",
  EVENT_COMPLETE: "complete",
} as const;

export async function main(): Promise<void> {
  const prisma = getPrismaClientForStateCode(IDAHO_TH_STATE_CODE);

  console.info(
    JSON.stringify({
      job: DOCUMENT_JANITOR_JOB_LOG.JOB,
      event: DOCUMENT_JANITOR_JOB_LOG.EVENT_START,
    }),
  );

  // This job runs as a standalone Cloud Run Job, not through the Fastify
  // server's main.ts, so the GCS client singleton is never built otherwise —
  // every GCS delete in the sweep would throw "not initialized".
  await ensureGcsStorageInitialized();

  const result = await runDocumentJanitor({ prisma });

  console.info(
    JSON.stringify({
      job: DOCUMENT_JANITOR_JOB_LOG.JOB,
      event: DOCUMENT_JANITOR_JOB_LOG.EVENT_COMPLETE,
      ...result,
    }),
  );

  if (result.expiredIntakeShells > 0 || result.expiredPendingDocuments > 0) {
    // Every normal success/failure path already cleans up after itself, so
    // finding anything here means a process was killed mid-request — worth
    // knowing about even though the sweep already resolved it.
    captureMessage("Document janitor swept orphaned shells/documents", {
      level: "warning",
      extra: result,
    });
  }

  if (result.failedIntakeShells > 0 || result.failedPendingDocuments > 0) {
    // Each failure is already logged per row; the Sentry report is what the
    // failed-execution alert points people to, and the exit code is what
    // makes the run itself show up as failed in Cloud Run.
    captureMessage("Document janitor failed to sweep some shells/documents", {
      level: "error",
      extra: result,
    });
    process.exitCode = 1;
  }
}

// Bootstrap guard: true only when this module is the process entrypoint,
// which never happens under vitest.
/* v8 ignore start */
if (import.meta.url === new URL(process.argv[1] ?? "", "file://").href) {
  void runJobEntryPoint("Document janitor job", main);
}
/* v8 ignore stop */
