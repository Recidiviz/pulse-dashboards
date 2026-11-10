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

import { DateTime } from "luxon";

import { Prisma, type PrismaClient } from "~@idaho-th/prisma/client";
import {
  DIGEST_TIME_ZONE,
  INTERCOM_DIGEST_PAGE_SIZE,
  INTERCOM_SYNC_PAGE_SIZE,
  INTERCOM_SYNC_STATUS,
  PRISMA_UNIQUE_VIOLATION_CODE,
} from "~@idaho-th/trpc/intercom/intercom.constants";
import { normalizeEmail } from "~@idaho-th/trpc/intercom/intercom.mapper";
import { digestRecipientRowSchema } from "~@idaho-th/trpc/intercom/intercom.schema";
import type {
  DigestRecipientRow,
  EligibleProviderUserRow,
  UpsertHousingStaffInput,
  UpsertHousingStaffResult,
} from "~@idaho-th/trpc/intercom/intercom.types";

/**
 * Contact-sync eligibility: any *person* we can reach by email, whether or not
 * they have ever logged in and whether or not they are assigned to an
 * organization yet. See {@link digestEligibleProviderUserSql} for why this is
 * deliberately the wider of the two predicates.
 *
 * Organizations are not contacts — correspondence is addressed to the person.
 */
const CONTACT_SYNC_PROVIDER_USER_WHERE = {
  email: { not: "" },
} as const satisfies Prisma.HousingProviderUserWhereInput;

const HOUSING_STAFF_SYNC_SELECT = {
  id: true,
  email: true,
  pseudonymizedId: true,
  intercomContactId: true,
  intercomSyncedAt: true,
} as const;

export function startOfDigestDay(now: Date = new Date()): Date {
  return DateTime.fromJSDate(now, { zone: DIGEST_TIME_ZONE })
    .startOf("day")
    .toJSDate();
}

/**
 * Digest eligibility. Narrower than {@link CONTACT_SYNC_PROVIDER_USER_WHERE} by
 * `digestEnabled`: a person who has never logged in gets no digest, but their
 * Intercom contact is still synced ahead of time, so the first digest after
 * they log in does not wait for the next sync cycle.
 *
 * `digestEnabled` is decided once, on first login, and a deliberate opt-out is
 * never re-enabled — so an opted-out person stays out of every page below.
 */
export function digestEligibleProviderUserSql(): Prisma.Sql {
  return Prisma.sql`
    u.email <> ''
    AND u."digestEnabled" = true
  `;
}

export async function listEligibleProviderUserPage(
  prisma: PrismaClient,
  pageSize: number = INTERCOM_SYNC_PAGE_SIZE,
  cursorId?: string,
  onlyUnsynced = false,
): Promise<EligibleProviderUserRow[]> {
  // Keyset by value (`id > cursor`), never Prisma's `cursor`/`skip`: under
  // `onlyUnsynced` the walk writes `intercomSyncedAt`, so the cursor row leaves
  // the filtered set mid-walk and positional paging silently skips rows.
  return prisma.housingProviderUser.findMany({
    where: {
      ...CONTACT_SYNC_PROVIDER_USER_WHERE,
      ...(onlyUnsynced ? { intercomSyncedAt: null } : {}),
      ...(cursorId ? { id: { gt: cursorId } } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      intercomContactId: true,
      intercomSyncedAt: true,
    },
    orderBy: { id: "asc" },
    take: pageSize,
  });
}

/**
 * Has anything happened at *any* organization this person manages that they
 * have not seen and did not do themselves?
 *
 * The walk is user → assignments → organization → that organization's
 * applications, so a person who manages several is covered by one predicate and
 * therefore by one row, one digest, and one `lastDigestSentAt` write.
 *
 * Two different keys, deliberately:
 * - **Suppression is organization-wide.** The read state joins on
 *   `(applicationId, providerId)` only, so whichever colleague opened the
 *   timeline, the nudge stops for everyone at that organization.
 * - **Self-exclusion is personal.** The actor comparison is against this user's
 *   own `pseudonymizedId`, so the author of an event is skipped while their
 *   colleagues are still nudged about it.
 */
export function hasProviderUserUnreadVisibleEventSql(): Prisma.Sql {
  return Prisma.sql`
    EXISTS (
      SELECT 1
      FROM "HousingProviderUserAssignment" a
      JOIN "ProviderHousingApplication" pha
        ON pha."providerId" = a."providerId"
      JOIN "HousingApplicationTimelineEvent" e
        ON e."applicationId" = pha."applicationId"
       AND e."cmOnly" = false
       AND (
         e."scopedProviderId" IS NULL
         OR e."scopedProviderId" = a."providerId"
       )
      LEFT JOIN "ProviderTimelineReadState" rs
        ON rs."applicationId" = e."applicationId"
       AND rs."providerId" = a."providerId"
      WHERE a."providerUserId" = u.id
        AND (
          u."pseudonymizedId" IS NULL
          OR e."actorPseudonymizedId" IS NULL
          OR e."actorPseudonymizedId" <> u."pseudonymizedId"
        )
        AND e."createdAt" > COALESCE(
          rs."lastOpenedModalAt",
          '-infinity'::timestamp
        )
    )
  `;
}

function zParseRows<T>(
  schema: { parse: (value: unknown) => T },
  rows: unknown[],
): T[] {
  return rows.map((row, index) => {
    try {
      return schema.parse(row);
    } catch (err) {
      throw new Error(
        `Invalid digest query row at index ${index}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  });
}

/**
 * One row per *person* who should be nudged today, carrying their own name and
 * email. Activity at any of their organizations qualifies them, and the single
 * `lastDigestSentAt` on their row is what caps it at one email a day however
 * many of those organizations were busy.
 */
export async function listProviderUsersNeedingDigestPage(
  prisma: PrismaClient,
  pageSize: number = INTERCOM_DIGEST_PAGE_SIZE,
  cursorId?: string,
  now: Date = new Date(),
): Promise<DigestRecipientRow[]> {
  const dayStart = startOfDigestDay(now);
  const cursorFilter = cursorId
    ? Prisma.sql`AND u.id > ${cursorId}`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<unknown[]>(Prisma.sql`
    SELECT
      u.id,
      NULLIF(u."intercomContactId", '') AS "intercomContactId",
      u.email,
      u.name,
      NULLIF(u."pseudonymizedId", '') AS "pseudonymizedId"
    FROM "HousingProviderUser" u
    WHERE ${digestEligibleProviderUserSql()}
      ${cursorFilter}
      AND (u."lastDigestSentAt" IS NULL OR u."lastDigestSentAt" < ${dayStart})
      AND ${hasProviderUserUnreadVisibleEventSql()}
    ORDER BY u.id ASC
    LIMIT ${pageSize}
  `);

  return zParseRows(digestRecipientRowSchema, rows);
}

/**
 * Unchanged in meaning: a staff member is nudged about an event on one of their
 * applications that they have not opened and did not author. The split moved
 * staff reads to their own table, so the viewer-role filter is gone — the table
 * name is the discriminator now, and a provider's read can no longer reach it.
 */
export function hasStaffUnreadVisibleEventSql(): Prisma.Sql {
  return Prisma.sql`
    EXISTS (
      SELECT 1
      FROM "StaffHousingApplication" sha
      JOIN "HousingApplicationTimelineEvent" e
        ON e."applicationId" = sha."applicationId"
      LEFT JOIN "StaffTimelineReadState" rs
        ON rs."applicationId" = e."applicationId"
       AND rs."staffPseudonymizedId" = hs."pseudonymizedId"
      WHERE sha."staffPseudonymizedId" = hs."pseudonymizedId"
        AND (
          e."actorPseudonymizedId" IS NULL
          OR e."actorPseudonymizedId" <> hs."pseudonymizedId"
        )
        AND e."createdAt" > COALESCE(
          rs."lastOpenedModalAt",
          '-infinity'::timestamp
        )
    )
  `;
}

export async function listStaffNeedingDigestPage(
  prisma: PrismaClient,
  pageSize: number = INTERCOM_DIGEST_PAGE_SIZE,
  cursorId?: string,
  now: Date = new Date(),
): Promise<DigestRecipientRow[]> {
  const dayStart = startOfDigestDay(now);
  const cursorFilter = cursorId
    ? Prisma.sql`AND hs.id > ${cursorId}`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<unknown[]>(Prisma.sql`
    SELECT
      hs.id,
      NULLIF(hs."intercomContactId", '') AS "intercomContactId",
      hs.email,
      NULL::text AS name,
      hs."pseudonymizedId"
    FROM "HousingStaff" hs
    WHERE hs.email <> ''
      ${cursorFilter}
      AND (hs."lastDigestSentAt" IS NULL OR hs."lastDigestSentAt" < ${dayStart})
      AND ${hasStaffUnreadVisibleEventSql()}
    ORDER BY hs.id ASC
    LIMIT ${pageSize}
  `);

  return zParseRows(digestRecipientRowSchema, rows);
}

export async function upsertHousingStaffRow(
  prisma: PrismaClient,
  input: UpsertHousingStaffInput,
): Promise<UpsertHousingStaffResult> {
  const email = normalizeEmail(input.email);
  const pseudonymizedId = input.pseudonymizedId.trim();

  try {
    const existing = await prisma.housingStaff.findUnique({
      where: { pseudonymizedId },
      select: HOUSING_STAFF_SYNC_SELECT,
    });

    if (!existing) {
      const created = await prisma.housingStaff.create({
        data: { pseudonymizedId, email },
        select: HOUSING_STAFF_SYNC_SELECT,
      });
      return {
        status: INTERCOM_SYNC_STATUS.CREATED,
        staff: created,
        emailChanged: true,
      };
    }

    if (existing.email === email) {
      return {
        status: INTERCOM_SYNC_STATUS.UPDATED,
        staff: existing,
        emailChanged: false,
      };
    }

    const updated = await prisma.housingStaff.update({
      where: { pseudonymizedId },
      data: { email },
      select: HOUSING_STAFF_SYNC_SELECT,
    });
    return {
      status: INTERCOM_SYNC_STATUS.UPDATED,
      staff: updated,
      emailChanged: true,
    };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === PRISMA_UNIQUE_VIOLATION_CODE
    ) {
      const raced = await prisma.housingStaff.findUnique({
        where: { pseudonymizedId },
        select: HOUSING_STAFF_SYNC_SELECT,
      });

      if (raced) {
        const owner = await prisma.housingStaff.findFirst({
          where: { email, NOT: { pseudonymizedId } },
          select: { pseudonymizedId: true },
        });
        if (owner) {
          return {
            status: INTERCOM_SYNC_STATUS.CONFLICT,
            existingPseudonymizedId: owner.pseudonymizedId,
          };
        }
        return {
          status: INTERCOM_SYNC_STATUS.UPDATED,
          staff: raced,
          emailChanged: raced.email !== email,
        };
      }
      const adopted = await prisma.housingStaff.findUnique({
        where: { email },
        select: HOUSING_STAFF_SYNC_SELECT,
      });
      if (adopted) {
        return {
          status: INTERCOM_SYNC_STATUS.ADOPTED,
          staff: adopted,
          emailChanged: false,
        };
      }
    }
    throw err;
  }
}

export async function setProviderUsersIntercomSyncBatch(
  prisma: PrismaClient,
  rows: ReadonlyArray<{ providerUserId: string; intercomContactId: string }>,
  syncedAt: Date = new Date(),
): Promise<void> {
  if (rows.length === 0) return;

  const values = Prisma.join(
    rows.map(
      (row) =>
        Prisma.sql`(${row.providerUserId}::text, ${row.intercomContactId}::text)`,
    ),
  );

  await prisma.$executeRaw(Prisma.sql`
    UPDATE "HousingProviderUser" AS u
    SET "intercomContactId" = v.contact_id,
        "intercomSyncedAt" = ${syncedAt}
    FROM (VALUES ${values}) AS v(id, contact_id)
    WHERE u.id = v.id
  `);
}

/**
 * The day gate for the provider audience. It lives on the person, so a second
 * organization's activity cannot earn them a second email the same day.
 */
export async function markProviderUserDigestSent(
  prisma: PrismaClient,
  providerUserId: string,
  sentAt: Date = new Date(),
): Promise<void> {
  await prisma.housingProviderUser.update({
    where: { id: providerUserId },
    data: { lastDigestSentAt: sentAt },
  });
}

export async function markStaffDigestSent(
  prisma: PrismaClient,
  staffId: string,
  sentAt: Date = new Date(),
): Promise<void> {
  await prisma.housingStaff.update({
    where: { id: staffId },
    data: { lastDigestSentAt: sentAt },
  });
}

export async function setProviderUserIntercomSync(
  prisma: PrismaClient,
  providerUserId: string,
  fields: { intercomContactId: string; intercomSyncedAt?: Date },
): Promise<void> {
  await prisma.housingProviderUser.update({
    where: { id: providerUserId },
    data: {
      intercomContactId: fields.intercomContactId,
      intercomSyncedAt: fields.intercomSyncedAt ?? new Date(),
    },
  });
}

export async function setStaffIntercomSync(
  prisma: PrismaClient,
  staffId: string,
  fields: { intercomContactId: string; intercomSyncedAt?: Date },
): Promise<void> {
  await prisma.housingStaff.update({
    where: { id: staffId },
    data: {
      intercomContactId: fields.intercomContactId,
      intercomSyncedAt: fields.intercomSyncedAt ?? new Date(),
    },
  });
}
