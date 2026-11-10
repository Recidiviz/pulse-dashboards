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

import { Prisma } from "~@idaho-th/prisma/client";
import { mapWithConcurrency } from "~@idaho-th/trpc/intercom/intercom.concurrency";
import { isIntercomTokenConfigured } from "~@idaho-th/trpc/intercom/intercom.config";
import {
  DEFAULT_UPSERT_CONCURRENCY,
  INTERCOM_ERROR_CODE,
  INTERCOM_LOGIN_SYNC_MAX_ATTEMPTS,
  INTERCOM_LOGIN_SYNC_TIMEOUT_MS,
  INTERCOM_SYNC_PAGE_SIZE,
  INTERCOM_SYNC_STATUS,
  PRISMA_UNIQUE_VIOLATION_CODE,
} from "~@idaho-th/trpc/intercom/intercom.constants";
import { upsertContact as defaultUpsertContact } from "~@idaho-th/trpc/intercom/intercom.contacts";
import {
  listEligibleProviderUserPage,
  setProviderUserIntercomSync,
  setProviderUsersIntercomSyncBatch,
} from "~@idaho-th/trpc/intercom/intercom.helper";
import { intercomErrorCode } from "~@idaho-th/trpc/intercom/intercom.http";
import { mapProviderToIntercomContact } from "~@idaho-th/trpc/intercom/intercom.mapper";
import type {
  BulkProviderSyncResult,
  ProviderSyncResult,
  SyncAllProvidersDeps,
  SyncProviderContactDeps,
  UpsertContactFn,
} from "~@idaho-th/trpc/intercom/intercom.types";

export function isDuplicateIntercomContactError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === PRISMA_UNIQUE_VIOLATION_CODE &&
    (err.meta?.["target"] as string[] | undefined)?.includes(
      "intercomContactId",
    ) === true
  );
}

export function emptyBulkProviderSyncResult(): BulkProviderSyncResult {
  return { succeeded: 0, failed: 0, skipped: 0, results: [] };
}

function isTokenAvailable(
  deps: Pick<SyncProviderContactDeps, "requestOptions">,
): boolean {
  return Boolean(deps.requestOptions?.token) || isIntercomTokenConfigured();
}

/**
 * Syncs one person's Intercom contact. The contact carries the person's own
 * name and email — organizations are never contacts — so the identity synced
 * here is a `HousingProviderUser`, whatever organizations they manage.
 */
export async function syncProviderContact(
  deps: SyncProviderContactDeps,
): Promise<ProviderSyncResult> {
  const { prisma, providerUserId } = deps;

  if (!isTokenAvailable(deps)) {
    return { status: INTERCOM_SYNC_STATUS.DISABLED, providerUserId };
  }

  const upsertContact: UpsertContactFn =
    deps.upsertContact ?? defaultUpsertContact;

  try {
    const providerUser = deps.provider
      ? {
          id: providerUserId,
          email: deps.provider.email,
          name: deps.provider.name,
          intercomContactId: deps.provider.intercomContactId ?? null,
          intercomSyncedAt: deps.provider.intercomSyncedAt,
        }
      : await prisma.housingProviderUser.findUnique({
          where: { id: providerUserId },
          select: {
            id: true,
            email: true,
            name: true,
            intercomContactId: true,
            intercomSyncedAt: true,
          },
        });

    if (!providerUser) {
      return { status: INTERCOM_SYNC_STATUS.INELIGIBLE, providerUserId };
    }

    if (providerUser.intercomSyncedAt && !deps.force) {
      return { status: INTERCOM_SYNC_STATUS.SKIPPED, providerUserId };
    }

    const contact = mapProviderToIntercomContact(providerUser);
    if (!contact) {
      return { status: INTERCOM_SYNC_STATUS.INELIGIBLE, providerUserId };
    }

    const { status, contactId } = await upsertContact(
      contact,
      deps.requestOptions,
      providerUser.intercomContactId,
    );

    if (!deps.deferPersist) {
      await setProviderUserIntercomSync(prisma, providerUserId, {
        intercomContactId: contactId,
      });
    }

    return { status, providerUserId, contactId };
  } catch (err) {
    return {
      status: INTERCOM_SYNC_STATUS.FAILED,
      providerUserId,
      code: isDuplicateIntercomContactError(err)
        ? INTERCOM_ERROR_CODE.DUPLICATE_INTERCOM_CONTACT
        : intercomErrorCode(err),
    };
  }
}

export async function syncProviderContactBestEffort(
  deps: SyncProviderContactDeps,
): Promise<ProviderSyncResult> {
  return syncProviderContact({
    ...deps,
    force: deps.force ?? false,
    requestOptions: {
      ...deps.requestOptions,
      maxAttempts:
        deps.requestOptions?.maxAttempts ?? INTERCOM_LOGIN_SYNC_MAX_ATTEMPTS,
      timeoutMs:
        deps.requestOptions?.timeoutMs ??
        deps.timeoutMs ??
        INTERCOM_LOGIN_SYNC_TIMEOUT_MS,
    },
  });
}

export async function syncAllProviders(
  deps: SyncAllProvidersDeps,
): Promise<BulkProviderSyncResult> {
  const pageSize = Math.max(1, deps.pageSize ?? INTERCOM_SYNC_PAGE_SIZE);
  const concurrency = Math.max(
    1,
    deps.concurrency ?? DEFAULT_UPSERT_CONCURRENCY,
  );
  const force = deps.force ?? true;

  if (!isTokenAvailable(deps)) {
    return emptyBulkProviderSyncResult();
  }

  const aggregate = emptyBulkProviderSyncResult();
  let cursorId: string | undefined;

  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const rows = await listEligibleProviderUserPage(
      deps.prisma,
      pageSize,
      cursorId,
      // onlyUnsynced — without `force` those rows are skipped anyway.
      !force,
    );
    if (rows.length === 0) {
      return aggregate;
    }

    // eslint-disable-next-line no-await-in-loop
    const pageResults = await mapWithConcurrency(rows, concurrency, (row) =>
      syncProviderContact({
        prisma: deps.prisma,
        providerUserId: row.id,
        // The page row carries every field the upsert reads; avoids an N+1.
        provider: {
          email: row.email,
          name: row.name,
          intercomContactId: row.intercomContactId,
          intercomSyncedAt: row.intercomSyncedAt,
        },
        force,
        deferPersist: true,
        upsertContact: deps.upsertContact,
        requestOptions: deps.requestOptions,
      }),
    );

    // eslint-disable-next-line no-await-in-loop
    await setProviderUsersIntercomSyncBatch(
      deps.prisma,
      pageResults.flatMap((result) =>
        result.status === INTERCOM_SYNC_STATUS.CREATED ||
        result.status === INTERCOM_SYNC_STATUS.UPDATED
          ? [
              {
                providerUserId: result.providerUserId,
                intercomContactId: result.contactId,
              },
            ]
          : [],
      ),
    );

    for (const result of pageResults) {
      if (result.status === INTERCOM_SYNC_STATUS.FAILED) aggregate.failed += 1;
      else if (
        result.status === INTERCOM_SYNC_STATUS.SKIPPED ||
        result.status === INTERCOM_SYNC_STATUS.INELIGIBLE ||
        result.status === INTERCOM_SYNC_STATUS.DISABLED
      ) {
        aggregate.skipped += 1;
      } else {
        aggregate.succeeded += 1;
      }
    }
    aggregate.results.push(...pageResults);

    cursorId = rows[rows.length - 1]?.id;
    if (rows.length < pageSize || !cursorId) {
      return aggregate;
    }
  }
}
