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
 * Seed providers from the CSV, then create their Intercom contacts.
 *
 * The two run together on purpose. Providers enter the database only when this
 * job runs, so this is the earliest — and most reliable — moment to create
 * their contacts. It also puts hours or days between contact creation and the
 * first digest send, which a contact needs before it is reliably addressable.
 *
 * Contact sync is best effort: `syncAllProviders` reports per-provider failures
 * rather than throwing, so an Intercom outage cannot fail a seed. Anyone missed
 * is picked up by the digest's own on-demand contact creation.
 *
 * Logs counts and provider ids only — never email.
 */

import { getPrismaClientForStateCode } from "~@idaho-th/prisma";
import { seed } from "~@idaho-th/prisma/seed";
import { IDAHO_TH_STATE_CODE } from "~@idaho-th/trpc/auth/constants";
import { isIntercomTokenConfigured } from "~@idaho-th/trpc/intercom/intercom.config";
import { syncAllProviders } from "~@idaho-th/trpc/intercom/intercom.provider.sync";

const MAX_REPORTED_SYNC_FAILURES = 20;

function log(event: Record<string, unknown>): void {
  console.info(JSON.stringify({ job: "seed-db", ...event }));
}

async function syncIntercomContacts(): Promise<void> {
  if (!isIntercomTokenConfigured()) {
    log({ event: "intercom_sync", status: "disabled", reason: "no_token" });
    return;
  }

  const prisma = getPrismaClientForStateCode(IDAHO_TH_STATE_CODE);
  // force: false — only providers without a contact are touched, so re-seeding
  // costs no Intercom calls for anyone already synced.
  const result = await syncAllProviders({ prisma, force: false });

  log({
    event: "intercom_sync",
    status: result.failed > 0 ? "partial" : "ok",
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
}

async function main(): Promise<void> {
  await seed();

  try {
    await syncIntercomContacts();
  } catch (err) {
    // Never fail the seed on Intercom trouble — the rows are already committed
    // and the digest creates any missing contact on demand.
    log({
      event: "intercom_sync",
      status: "error",
      error: err instanceof Error ? err.message : "unknown_error",
    });
  }

  await getPrismaClientForStateCode(IDAHO_TH_STATE_CODE).$disconnect();
}

main().catch(async (err: unknown) => {
  console.error("Seed failed:", err);
  await getPrismaClientForStateCode(IDAHO_TH_STATE_CODE).$disconnect();
  process.exit(1);
});
