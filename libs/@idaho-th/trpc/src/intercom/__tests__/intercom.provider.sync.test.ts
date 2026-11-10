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

import { beforeEach, describe, expect, it, vi } from "vitest";

const isTokenConfiguredMock = vi.hoisted(() => vi.fn(() => true));
const setProviderUserIntercomSyncMock = vi.hoisted(() => vi.fn());
const setProviderUsersIntercomSyncBatchMock = vi.hoisted(() => vi.fn());
const listEligibleProviderUserPageMock = vi.hoisted(() => vi.fn());

vi.mock("~@idaho-th/trpc/intercom/intercom.config", () => ({
  isIntercomTokenConfigured: isTokenConfiguredMock,
}));

vi.mock("~@idaho-th/trpc/intercom/intercom.helper", async () => {
  const actual = await vi.importActual<
    typeof import("~@idaho-th/trpc/intercom/intercom.helper")
  >("~@idaho-th/trpc/intercom/intercom.helper");
  return {
    ...actual,
    setProviderUserIntercomSync: setProviderUserIntercomSyncMock,
    setProviderUsersIntercomSyncBatch: setProviderUsersIntercomSyncBatchMock,
    listEligibleProviderUserPage: listEligibleProviderUserPageMock,
  };
});

import { Prisma } from "~@idaho-th/prisma/client";
import {
  INTERCOM_LOGIN_SYNC_MAX_ATTEMPTS,
  INTERCOM_LOGIN_SYNC_TIMEOUT_MS,
} from "~@idaho-th/trpc/intercom/intercom.constants";
import {
  syncAllProviders,
  syncProviderContact,
  syncProviderContactBestEffort,
} from "~@idaho-th/trpc/intercom/intercom.provider.sync";

beforeEach(() => {
  vi.clearAllMocks();
  isTokenConfiguredMock.mockReturnValue(true);
});

describe("syncProviderContact", () => {
  it("returns disabled when Intercom token is missing", async () => {
    isTokenConfiguredMock.mockReturnValue(false);
    const prisma = { housingProviderUser: { findUnique: vi.fn() } };

    await expect(
      syncProviderContact({ prisma: prisma as never, providerUserId: "p1" }),
    ).resolves.toEqual({ status: "disabled", providerUserId: "p1" });
  });

  it("skips when already synced and force is false", async () => {
    const prisma = {
      housingProviderUser: {
        findUnique: vi.fn().mockResolvedValue({
          id: "p1",
          email: "a@b.com",
          name: "A",
          intercomSyncedAt: new Date(),
        }),
      },
    };

    await expect(
      syncProviderContact({ prisma: prisma as never, providerUserId: "p1" }),
    ).resolves.toEqual({ status: "skipped", providerUserId: "p1" });
  });

  // The re-login path: `linkProvider.ts` passes the row inline with no `force`
  // and no `intercomContactId`. `intercomSyncedAt` alone must end the call, so a
  // provider logging in for the hundredth time costs Intercom nothing. Omitting
  // `intercomContactId` is safe *because* of this guard — the two columns are
  // only ever written together, so a stored contact id implies a stored
  // `intercomSyncedAt`, which lands here before any request is built.
  it("issues no Intercom request when an already-synced provider logs in again", async () => {
    const prisma = {
      housingProviderUser: { findUnique: vi.fn() },
    };
    const upsertContact = vi.fn();

    // The wrapper is what the login route calls, and it must not force.
    const result = await syncProviderContactBestEffort({
      prisma: prisma as never,
      providerUserId: "p1",
      provider: {
        email: "a@b.com",
        name: "A",
        intercomSyncedAt: new Date("2026-03-01T00:00:00.000Z"),
      },
      upsertContact,
    });

    expect(result).toEqual({ status: "skipped", providerUserId: "p1" });
    expect(upsertContact).not.toHaveBeenCalled();
    expect(setProviderUserIntercomSyncMock).not.toHaveBeenCalled();
    // The inline row also spares the lookup the digest/backfill paths need.
    expect(prisma.housingProviderUser.findUnique).not.toHaveBeenCalled();
  });

  // The login path must never let Intercom slow a login down: one attempt, on a
  // deadline. Pinned here because the route now delegates that budget entirely.
  it("gives the login path a single attempt on a bounded deadline", async () => {
    const prisma = { housingProviderUser: { findUnique: vi.fn() } };
    const upsertContact = vi
      .fn()
      .mockResolvedValue({ status: "created", contactId: "ic-1" });

    await syncProviderContactBestEffort({
      prisma: prisma as never,
      providerUserId: "p1",
      provider: { email: "a@b.com", name: "A", intercomSyncedAt: null },
      upsertContact,
    });

    const requestOptions = upsertContact.mock.calls[0]?.[1];
    expect(requestOptions).toMatchObject({
      maxAttempts: INTERCOM_LOGIN_SYNC_MAX_ATTEMPTS,
      timeoutMs: INTERCOM_LOGIN_SYNC_TIMEOUT_MS,
    });
    // No pre-armed signal: each call in the sequence arms its own deadline.
    expect(requestOptions.signal).toBeUndefined();
  });

  it("upserts and persists contact id", async () => {
    const prisma = {
      housingProviderUser: {
        findUnique: vi.fn().mockResolvedValue({
          id: "p1",
          email: "a@b.com",
          name: "A",
          intercomSyncedAt: null,
        }),
      },
    };
    const upsertContact = vi.fn().mockResolvedValue({
      status: "created",
      contactId: "ic-1",
    });

    await expect(
      syncProviderContact({
        prisma: prisma as never,
        providerUserId: "p1",
        upsertContact,
      }),
    ).resolves.toEqual({
      status: "created",
      providerUserId: "p1",
      contactId: "ic-1",
    });

    expect(setProviderUserIntercomSyncMock).toHaveBeenCalledWith(
      prisma,
      "p1",
      expect.objectContaining({ intercomContactId: "ic-1" }),
    );
  });

  it("uses the provided provider snapshot without a DB read", async () => {
    const prisma = {
      housingProviderUser: {
        findUnique: vi.fn(),
      },
    };
    const upsertContact = vi.fn().mockResolvedValue({
      status: "updated",
      contactId: "ic-2",
    });

    await expect(
      syncProviderContact({
        prisma: prisma as never,
        providerUserId: "p1",
        provider: {
          email: "a@b.com",
          name: "A",
          intercomSyncedAt: null,
        },
        upsertContact,
      }),
    ).resolves.toEqual({
      status: "updated",
      providerUserId: "p1",
      contactId: "ic-2",
    });

    expect(prisma.housingProviderUser.findUnique).not.toHaveBeenCalled();
  });

  it("passes the stored contact id through so the upsert can skip the lookup", async () => {
    const prisma = { housingProviderUser: { findUnique: vi.fn() } };
    const upsertContact = vi
      .fn()
      .mockResolvedValue({ status: "updated", contactId: "ic-9" });

    await syncProviderContact({
      prisma: prisma as never,
      providerUserId: "p1",
      provider: {
        email: "a@b.com",
        name: "A",
        intercomContactId: "ic-9",
        intercomSyncedAt: new Date(),
      },
      force: true,
      upsertContact,
    });

    expect(upsertContact).toHaveBeenCalledWith(
      { email: "a@b.com", externalId: "provider:p1", name: "A" },
      undefined,
      "ic-9",
    );
  });

  it("returns failed without throwing when upsert errors", async () => {
    const prisma = {
      housingProviderUser: {
        findUnique: vi.fn().mockResolvedValue({
          id: "p1",
          email: "a@b.com",
          name: "A",
          intercomSyncedAt: null,
        }),
      },
    };

    await expect(
      syncProviderContact({
        prisma: prisma as never,
        providerUserId: "p1",
        upsertContact: vi.fn().mockRejectedValue(new Error("boom")),
      }),
    ).resolves.toEqual({
      status: "failed",
      providerUserId: "p1",
      code: "unknown_error",
    });
  });

  it("reports a diagnosable cause when the contact id is already taken", async () => {
    const prisma = {
      housingProviderUser: {
        findUnique: vi.fn().mockResolvedValue({
          id: "p2",
          email: "shared@b.com",
          name: "B",
          intercomSyncedAt: null,
        }),
      },
    };
    // `Once`: vi.clearAllMocks() does not reset implementations, so a sticky
    // rejection would leak into the suite below.
    setProviderUserIntercomSyncMock.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
        meta: { target: ["intercomContactId"] },
      }),
    );

    const result = await syncProviderContact({
      prisma: prisma as never,
      providerUserId: "p2",
      upsertContact: vi
        .fn()
        .mockResolvedValue({ status: "updated", contactId: "c1" }),
    });

    expect(result).toEqual({
      status: "failed",
      providerUserId: "p2",
      code: "duplicate_intercom_contact",
    });
    // The reported failure names the constraint, never the shared email.
    expect(JSON.stringify(result)).not.toContain("shared@b.com");
  });
});

describe("syncAllProviders", () => {
  it("walks keyset pages and aggregates counts", async () => {
    listEligibleProviderUserPageMock
      .mockResolvedValueOnce([
        {
          id: "p1",
          email: "a@b.com",
          name: "A",
          intercomContactId: null,
          intercomSyncedAt: null,
        },
      ])
      .mockResolvedValueOnce([]);

    const findUnique = vi.fn();
    const prisma = { housingProviderUser: { findUnique } };
    const upsertContact = vi.fn().mockResolvedValue({
      status: "updated",
      contactId: "ic-1",
    });

    const result = await syncAllProviders({
      prisma: prisma as never,
      upsertContact,
      pageSize: 10,
    });

    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);
    // The page row is passed straight through — no per-provider re-read.
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("reads only unsynced providers when not forcing, and calls Intercom for none of them", async () => {
    listEligibleProviderUserPageMock.mockResolvedValue([]);
    const upsertContact = vi.fn();

    const result = await syncAllProviders({
      prisma: { housingProviderUser: { findUnique: vi.fn() } } as never,
      upsertContact,
      force: false,
    });

    expect(listEligibleProviderUserPageMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number),
      undefined,
      true, // onlyUnsynced
    );
    expect(upsertContact).not.toHaveBeenCalled();
    expect(result.succeeded).toBe(0);
  });

  it("persists a page in one batch instead of one write per provider", async () => {
    listEligibleProviderUserPageMock
      .mockResolvedValueOnce([
        {
          id: "p1",
          email: "a@b.com",
          name: "A",
          intercomContactId: "ic-1",
          intercomSyncedAt: null,
        },
        {
          id: "p2",
          email: "c@d.com",
          name: "C",
          intercomContactId: null,
          intercomSyncedAt: null,
        },
      ])
      .mockResolvedValueOnce([]);

    const upsertContact = vi
      .fn()
      .mockResolvedValueOnce({ status: "updated", contactId: "ic-1" })
      .mockResolvedValueOnce({ status: "created", contactId: "ic-2" });

    await syncAllProviders({
      prisma: { housingProviderUser: { findUnique: vi.fn() } } as never,
      upsertContact,
      pageSize: 10,
    });

    expect(setProviderUserIntercomSyncMock).not.toHaveBeenCalled();
    expect(setProviderUsersIntercomSyncBatchMock).toHaveBeenCalledTimes(1);
    expect(setProviderUsersIntercomSyncBatchMock).toHaveBeenCalledWith(
      expect.anything(),
      [
        { providerUserId: "p1", intercomContactId: "ic-1" },
        { providerUserId: "p2", intercomContactId: "ic-2" },
      ],
    );
    // The stored id is handed to the upsert so it can skip the search.
    expect(upsertContact).toHaveBeenNthCalledWith(
      1,
      { email: "a@b.com", externalId: "provider:p1", name: "A" },
      undefined,
      "ic-1",
    );
  });
});
