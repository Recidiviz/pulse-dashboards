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
 * Cloud Run Job entry: create Intercom contacts for providers already in the
 * database. Manually executed — deliberately not scheduled.
 *
 * Separate from the seed job so contacts can be created without re-running the
 * CSV import, which deletes hotel/shelter locations and providers dropped from
 * the source file.
 *
 * Logs counts and provider ids only — never email.
 */

import { captureMessage, flush } from "@sentry/node";

import { getPrismaClientForStateCode } from "~@idaho-th/prisma";
import { runJobEntryPoint } from "~@idaho-th/server/jobs/runJobEntryPoint";
import { IDAHO_TH_STATE_CODE } from "~@idaho-th/trpc/auth/constants";
import { isIntercomTokenConfigured } from "~@idaho-th/trpc/intercom/intercom.config";
import {
  INTERCOM_SYNC_STATUS,
  PROVIDER_SYNC_JOB_LOG,
} from "~@idaho-th/trpc/intercom/intercom.constants";
import {
  hasOperationalFailure,
  isPermanentRecipientFailure,
} from "~@idaho-th/trpc/intercom/intercom.digest";
import { syncAllProviders } from "~@idaho-th/trpc/intercom/intercom.provider.sync";

const MAX_REPORTED_SYNC_FAILURES = 50;

function log(event: Record<string, unknown>): void {
  console.info(JSON.stringify({ job: PROVIDER_SYNC_JOB_LOG.JOB, ...event }));
}

export async function main(): Promise<void> {
  if (!isIntercomTokenConfigured()) {
    console.error(
      JSON.stringify({
        job: PROVIDER_SYNC_JOB_LOG.JOB,
        event: PROVIDER_SYNC_JOB_LOG.EVENT_ABORT,
        reason: PROVIDER_SYNC_JOB_LOG.REASON_MISSING_ENV,
      }),
    );
    captureMessage(
      "Intercom provider sync job aborted: missing INTERCOM_TOKEN",
      "error",
    );
    await flush(2000);
    process.exitCode = 1;
    return;
  }

  log({ event: PROVIDER_SYNC_JOB_LOG.EVENT_START });

  const prisma = getPrismaClientForStateCode(IDAHO_TH_STATE_CODE);
  // force: false — only providers without a contact are read or sent to
  // Intercom, so a re-run costs nothing for anyone already synced.
  const result = await syncAllProviders({ prisma, force: false });

  log({
    event: PROVIDER_SYNC_JOB_LOG.EVENT_COMPLETE,
    succeeded: result.succeeded,
    failed: result.failed,
    skipped: result.skipped,
    failures: result.results
      .filter((entry) => entry.status === "failed")
      .slice(0, MAX_REPORTED_SYNC_FAILURES)
      .map((entry) => ({
        providerUserId: entry.providerUserId,
        code: entry.code,
      })),
  });

  const failedPermanent = result.results.filter(
    (entry) =>
      entry.status === INTERCOM_SYNC_STATUS.FAILED &&
      isPermanentRecipientFailure(entry.code),
  ).length;
  const counts = {
    sent: result.succeeded,
    failed: result.failed,
    failedPermanent,
  };

  if (hasOperationalFailure(counts, counts.sent)) {
    // Per-provider failures are caught and counted inside syncAllProviders,
    // not thrown — this is the only place they're ever reported to Sentry.
    captureMessage("Intercom provider sync job completed with failures", {
      level: "error",
      extra: {
        succeeded: result.succeeded,
        failed: result.failed,
        failedPermanent,
      },
    });
    process.exitCode = 1;
  }
}

// Bootstrap guard: true only when this module is the process entrypoint,
// which never happens under vitest.
/* v8 ignore start */
if (import.meta.url === new URL(process.argv[1] ?? "", "file://").href) {
  void runJobEntryPoint("Intercom provider sync job", main);
}
/* v8 ignore stop */
