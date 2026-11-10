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
import { describe, expect, it, vi } from "vitest";

import { Prisma } from "~@idaho-th/prisma/client";
import {
  startOfDigestDay,
  upsertHousingStaffRow,
} from "~@idaho-th/trpc/intercom/intercom.helper";
import { normalizeEmail } from "~@idaho-th/trpc/intercom/intercom.mapper";

describe("startOfDigestDay", () => {
  it("returns midnight America/Denver for a mid-day Instant", () => {
    // 2026-03-10 18:30 UTC = 12:30 PM MDT
    const now = new Date("2026-03-10T18:30:00.000Z");
    const start = startOfDigestDay(now);
    const denver = DateTime.fromJSDate(start, { zone: "America/Denver" });
    expect(denver.toISODate()).toBe("2026-03-10");
    expect(denver.hour).toBe(0);
    expect(denver.minute).toBe(0);
  });

  it("uses the previous Mountain calendar day near UTC midnight after MT evening", () => {
    // 2026-01-15 06:00 UTC = 2026-01-14 11:00 PM MST
    const now = new Date("2026-01-15T06:00:00.000Z");
    const start = startOfDigestDay(now);
    expect(
      DateTime.fromJSDate(start, { zone: "America/Denver" }).toISODate(),
    ).toBe("2026-01-14");
  });
});

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Alex@Example.COM ")).toBe("alex@example.com");
  });
});

/**
 * `HousingStaff.email` is unique while lookups key on `pseudonymizedId`, so the
 * P2002 recovery path decides whether a case manager can log in at all. These
 * exercise it directly — the staff-sync suite mocks this function out.
 */
describe("upsertHousingStaffRow P2002 recovery", () => {
  const EMAIL = "cm@recidiviz.org";
  const uniqueViolation = () =>
    new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "test",
      meta: { target: ["email"] },
    });

  function fakePrisma(rows: {
    byPseudonymizedId?: Record<string, unknown>;
    byEmail?: Record<string, unknown>;
    ownerOfEmail?: { pseudonymizedId: string } | null;
  }) {
    return {
      housingStaff: {
        findUnique: vi.fn(({ where }: { where: Record<string, string> }) =>
          Promise.resolve(
            where["email"] !== undefined
              ? rows.byEmail?.[where["email"]] ?? null
              : rows.byPseudonymizedId?.[where["pseudonymizedId"] ?? ""] ??
                  null,
          ),
        ),
        findFirst: vi.fn(() => Promise.resolve(rows.ownerOfEmail ?? null)),
        create: vi.fn(() => Promise.reject(uniqueViolation())),
        update: vi.fn(() => Promise.reject(uniqueViolation())),
      },
    } as never;
  }

  // The reviewer's race: two concurrent first logins mint two uuids, one wins the
  // row. The loser must adopt the winner's id, not be denied — otherwise the
  // losing uuid sits in Auth0 metadata and every later login is refused.
  it("adopts the existing row when a fresh identifier collides on email", async () => {
    const winner = {
      id: "s1",
      email: EMAIL,
      pseudonymizedId: "winner-uuid",
      intercomContactId: null,
      intercomSyncedAt: null,
    };
    const prisma = fakePrisma({ byEmail: { [EMAIL]: winner } });

    const result = await upsertHousingStaffRow(prisma, {
      pseudonymizedId: "loser-uuid",
      email: EMAIL,
    });

    expect(result).toEqual({
      status: "adopted",
      staff: winner,
      emailChanged: false,
    });
  });

  // Distinct from the above: our row exists and we tried to move its address onto
  // another row's. Two identities, one address — a merge would be a guess.
  it("still refuses when an existing row's email would collide", async () => {
    const mine = {
      id: "s2",
      email: "old@recidiviz.org",
      pseudonymizedId: "mine-uuid",
      intercomContactId: null,
      intercomSyncedAt: null,
    };
    const prisma = fakePrisma({
      byPseudonymizedId: { "mine-uuid": mine },
      ownerOfEmail: { pseudonymizedId: "someone-else-uuid" },
    });

    const result = await upsertHousingStaffRow(prisma, {
      pseudonymizedId: "mine-uuid",
      email: EMAIL,
    });

    expect(result).toEqual({
      status: "conflict",
      existingPseudonymizedId: "someone-else-uuid",
    });
  });

  // A collision that has already resolved itself by the time we look — nobody
  // else holds the address. Report the row as it stands rather than refusing.
  it("reports an update when the colliding address has no other owner", async () => {
    const mine = {
      id: "s3",
      email: "old@recidiviz.org",
      pseudonymizedId: "mine-uuid",
      intercomContactId: null,
      intercomSyncedAt: null,
    };
    const prisma = fakePrisma({
      byPseudonymizedId: { "mine-uuid": mine },
      ownerOfEmail: null,
    });

    const result = await upsertHousingStaffRow(prisma, {
      pseudonymizedId: "mine-uuid",
      email: EMAIL,
    });

    expect(result).toEqual({
      status: "updated",
      staff: mine,
      emailChanged: true,
    });
  });
});
