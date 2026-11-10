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
 * Cloud Run Job entry: send weekday Intercom digest emails (providers + staff).
 * Logs only aggregate counts — never email or other PII.
 */

import { captureMessage, flush } from "@sentry/node";

import { getPrismaClientForStateCode } from "~@idaho-th/prisma";
import { runJobEntryPoint } from "~@idaho-th/server/jobs/runJobEntryPoint";
import { IDAHO_TH_STATE_CODE } from "~@idaho-th/trpc/auth/constants";
import { isIntercomEnvConfigured } from "~@idaho-th/trpc/intercom/intercom.config";
import { DIGEST_JOB_LOG } from "~@idaho-th/trpc/intercom/intercom.constants";
import {
  hasOperationalFailure,
  runHousingDigest,
} from "~@idaho-th/trpc/intercom/intercom.digest";

function pluralize(count: number, term: string): string {
  return `${count} ${term}${count === 1 ? "" : "s"}`;
}

export async function main(): Promise<void> {
  if (!isIntercomEnvConfigured()) {
    console.error(
      JSON.stringify({
        job: DIGEST_JOB_LOG.JOB,
        event: DIGEST_JOB_LOG.EVENT_ABORT,
        reason: DIGEST_JOB_LOG.REASON_MISSING_ENV,
      }),
    );
    captureMessage(
      "Intercom digest job aborted: missing INTERCOM_TOKEN/INTERCOM_ADMIN_ID",
      "error",
    );
    await flush(2000);
    process.exitCode = 1;
    return;
  }

  console.info(
    JSON.stringify({
      job: DIGEST_JOB_LOG.JOB,
      event: DIGEST_JOB_LOG.EVENT_START,
    }),
  );

  const prisma = getPrismaClientForStateCode(IDAHO_TH_STATE_CODE);
  const stats = await runHousingDigest({
    prisma,
    logEvent: (event) =>
      console.info(JSON.stringify({ job: DIGEST_JOB_LOG.JOB, ...event })),
  });

  console.info(
    JSON.stringify({
      job: DIGEST_JOB_LOG.JOB,
      event: DIGEST_JOB_LOG.EVENT_COMPLETE,
      ...stats,
    }),
  );

  const providerCounts = {
    sent: stats.providersSent,
    failed: stats.providersFailed,
    failedPermanent: stats.providersFailedPermanent,
  };
  const staffCounts = {
    sent: stats.staffSent,
    failed: stats.staffFailed,
    failedPermanent: stats.staffFailedPermanent,
  };

  const providersTripped = hasOperationalFailure(
    providerCounts,
    staffCounts.sent,
  );
  const staffTripped = hasOperationalFailure(staffCounts, providerCounts.sent);

  if (providersTripped || staffTripped) {
    // Per-recipient failures are caught and counted inside runHousingDigest,
    // not thrown — this is the only place they're ever reported to Sentry.
    const trippedAudiences = [
      providersTripped ? "providers" : null,
      staffTripped ? "staff" : null,
    ].filter((audience): audience is string => audience !== null);
    captureMessage("Intercom digest job completed with failures", {
      level: "error",
      tags: { intercomDigestTrippedAudiences: trippedAudiences.join(",") },
      extra: {
        providersSent: stats.providersSent,
        providersFailed: stats.providersFailed,
        providersFailedPermanent: stats.providersFailedPermanent,
        staffSent: stats.staffSent,
        staffFailed: stats.staffFailed,
        staffFailedPermanent: stats.staffFailedPermanent,
      },
    });
    process.exitCode = 1;
  } else if (
    stats.providersFailedPermanent > 0 ||
    stats.staffFailedPermanent > 0
  ) {
    // Isolated, permanent per-recipient failures alongside otherwise-successful
    // sends — surface for visibility (e.g. verify the recipient's mailbox)
    // without paging.
    captureMessage(
      "Intercom digest job completed with recipients permanently rejected by Intercom — likely a suppressed or invalid mailbox, not a job failure",
      {
        level: "warning",
        extra: {
          providersFailedPermanent: stats.providersFailedPermanent,
          staffFailedPermanent: stats.staffFailedPermanent,
          summary: `${pluralize(
            stats.providersFailedPermanent,
            "provider",
          )} and ${pluralize(stats.staffFailedPermanent, "staff member")}`,
        },
      },
    );
  }

  if (stats.providersMarkSentFailed > 0 || stats.staffMarkSentFailed > 0) {
    // These recipients got today's email but aren't recorded as sent, so a
    // manual rerun today would email them again.
    captureMessage("Intercom digest sent emails it could not record as sent", {
      level: "error",
      extra: {
        providersMarkSentFailed: stats.providersMarkSentFailed,
        staffMarkSentFailed: stats.staffMarkSentFailed,
      },
    });
    process.exitCode = 1;
  }
}

// Bootstrap guard: true only when this module is the process entrypoint,
// which never happens under vitest.
/* v8 ignore start */
if (import.meta.url === new URL(process.argv[1] ?? "", "file://").href) {
  void runJobEntryPoint("Intercom digest job", main);
}
/* v8 ignore stop */
