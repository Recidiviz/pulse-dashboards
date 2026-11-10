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
 * Shared Cloud Run Job lifecycle: SIGTERM handling that doesn't misreport a
 * run that already finished, a fatal-error path that reports to Sentry, and
 * an explicit disconnect + exit so the job doesn't depend on Cloud Run's own
 * SIGTERM to end a successful run (see disconnectAllPrismaClients below).
 */

import { captureException, captureMessage, flush } from "@sentry/node";

import { disconnectAllPrismaClients } from "~@idaho-th/prisma";
import { errorLogFields } from "~@idaho-th/server/routes/internal/errorLogFields";

export async function runJobEntryPoint(
  jobName: string,
  main: () => Promise<void>,
): Promise<void> {
  let completed = false;

  const onSigterm = () => {
    if (completed) {
      // main() already returned; this SIGTERM is Cloud Run tearing down the
      // container after a finished run, not a mid-run kill.
      process.exit(typeof process.exitCode === "number" ? process.exitCode : 0);
      return;
    }
    captureMessage(`${jobName} received SIGTERM`, "error");
    // Cloud Run's SIGTERM-to-SIGKILL grace period is short; keep this under it.
    void flush(2000).finally(() => process.exit(1));
  };
  // Never removed: a SIGTERM during the final flush/disconnect would otherwise
  // end the process on the signal instead of the run's own exit code.
  process.on("SIGTERM", onSigterm);

  try {
    await main();
  } catch (err) {
    console.error(`${jobName} failed:`, errorLogFields(err));
    captureException(err);
    // Without this the run exits 0 and Cloud Run records a crash as a success.
    process.exitCode = 1;
  } finally {
    completed = true;
    // process.exit() terminates immediately; an unflushed capture never
    // reaches Sentry, and a pg pool left open keeps the process alive
    // indefinitely (getPrismaClientForStateCode caches pooled clients —
    // see libs/@idaho-th/prisma/src/utils.ts).
    await flush(2000);
    await disconnectAllPrismaClients();
    process.exit(typeof process.exitCode === "number" ? process.exitCode : 0);
  }
}
