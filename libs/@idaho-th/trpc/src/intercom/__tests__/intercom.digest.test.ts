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

const listProviderUsersMock = vi.hoisted(() => vi.fn());
const listStaffMock = vi.hoisted(() => vi.fn());
const markProviderUserMock = vi.hoisted(() => vi.fn());
const markStaffMock = vi.hoisted(() => vi.fn());
const setStaffIntercomSyncMock = vi.hoisted(() => vi.fn());
const syncProviderContactMock = vi.hoisted(() => vi.fn());
const upsertContactMock = vi.hoisted(() => vi.fn());
const digestSendAttemptCreateManyMock = vi.hoisted(() => vi.fn());

const mockPrisma = {
  digestSendAttempt: { createMany: digestSendAttemptCreateManyMock },
};

vi.mock("~@idaho-th/trpc/intercom/intercom.helper", () => ({
  listProviderUsersNeedingDigestPage: listProviderUsersMock,
  listStaffNeedingDigestPage: listStaffMock,
  markProviderUserDigestSent: markProviderUserMock,
  markStaffDigestSent: markStaffMock,
  setStaffIntercomSync: setStaffIntercomSyncMock,
}));

vi.mock("~@idaho-th/trpc/intercom/intercom.provider.sync", () => ({
  syncProviderContact: syncProviderContactMock,
}));

vi.mock("~@idaho-th/trpc/intercom/intercom.contacts", () => ({
  upsertContact: upsertContactMock,
}));

import {
  hasOperationalFailure,
  runHousingDigest,
} from "~@idaho-th/trpc/intercom/intercom.digest";
import { IntercomApiError } from "~@idaho-th/trpc/intercom/intercom.http";

const silentLog = () => undefined;

const syncedProvider = {
  id: "p1",
  intercomContactId: "ic-1",
  email: "p1@example.test",
  name: "P1",
  pseudonymizedId: "prov-1",
};

beforeEach(() => {
  vi.clearAllMocks();
  listProviderUsersMock.mockResolvedValue([]);
  listStaffMock.mockResolvedValue([]);
  markProviderUserMock.mockResolvedValue(undefined);
  markStaffMock.mockResolvedValue(undefined);
  setStaffIntercomSyncMock.mockResolvedValue(undefined);
  digestSendAttemptCreateManyMock.mockResolvedValue({ count: 0 });
});

describe("runHousingDigest", () => {
  it("skips weekend runs by default", async () => {
    // Saturday 2026-03-14 in America/Denver
    const now = new Date("2026-03-14T18:00:00.000Z");
    const stats = await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      getAdminId: () => "1",
      buildEmailContent: () => ({ subject: "s", htmlBody: "<p>x</p>" }),
      newContactSettleMs: 0,
      logEvent: silentLog,
    });
    expect(stats.skippedWeekend).toBe(true);
    expect(listProviderUsersMock).not.toHaveBeenCalled();
  });

  it("marks provider sent only after a successful message create", async () => {
    const now = new Date("2026-03-10T18:00:00.000Z"); // Tuesday
    listProviderUsersMock
      .mockResolvedValueOnce([syncedProvider])
      .mockResolvedValueOnce([]);
    listStaffMock.mockResolvedValue([]);

    const createMessage = vi
      .fn()
      .mockResolvedValue({ status: 200, data: { id: "msg-1" } });

    const stats = await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      runOnWeekend: true,
      createMessage,
      getAdminId: () => "99",
      buildEmailContent: () => ({ subject: "Updates", htmlBody: "<p>Hi</p>" }),
      newContactSettleMs: 0,
      logEvent: silentLog,
    });

    expect(stats.providersSent).toBe(1);
    expect(stats.providersFailed).toBe(0);
    expect(markProviderUserMock).toHaveBeenCalledWith(mockPrisma, "p1", now);
  });

  it("does not mark sent when createMessage fails", async () => {
    const now = new Date("2026-03-10T18:00:00.000Z");
    listProviderUsersMock
      .mockResolvedValueOnce([syncedProvider])
      .mockResolvedValueOnce([]);
    listStaffMock.mockResolvedValue([]);

    const stats = await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      createMessage: vi.fn().mockRejectedValue(new Error("send failed")),
      getAdminId: () => "99",
      buildEmailContent: () => ({ subject: "Updates", htmlBody: "<p>Hi</p>" }),
      newContactSettleMs: 0,
      logEvent: silentLog,
    });

    expect(stats.providersFailed).toBe(1);
    expect(stats.providersSent).toBe(0);
    expect(markProviderUserMock).not.toHaveBeenCalled();
  });

  it("sends staff digests and marks on success", async () => {
    const now = new Date("2026-03-10T18:00:00.000Z");
    listProviderUsersMock.mockResolvedValue([]);
    listStaffMock
      .mockResolvedValueOnce([
        {
          id: "s1",
          intercomContactId: "ic-s1",
          email: "s1@example.test",
          name: null,
          pseudonymizedId: "staff-1",
        },
      ])
      .mockResolvedValueOnce([]);

    const stats = await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      createMessage: vi
        .fn()
        .mockResolvedValue({ status: 200, data: { id: "msg-s" } }),
      getAdminId: () => "99",
      buildEmailContent: () => ({ subject: "Updates", htmlBody: "<p>Hi</p>" }),
      newContactSettleMs: 0,
      logEvent: silentLog,
    });

    expect(stats.staffSent).toBe(1);
    expect(markStaffMock).toHaveBeenCalledWith(mockPrisma, "s1", now);
  });

  it("creates a contact for a provider that has never synced, then emails them", async () => {
    const now = new Date("2026-03-10T18:00:00.000Z");
    listProviderUsersMock
      .mockResolvedValueOnce([
        {
          id: "maple",
          intercomContactId: null,
          email: "maple@example.test",
          name: "Jane Doe",
          pseudonymizedId: null,
        },
      ])
      .mockResolvedValueOnce([]);
    syncProviderContactMock.mockResolvedValue({
      status: "created",
      providerUserId: "maple",
      contactId: "ic-new",
    });
    const createMessage = vi
      .fn()
      .mockResolvedValue({ status: 200, data: { id: "msg-1" } });

    const stats = await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      createMessage,
      getAdminId: () => "99",
      buildEmailContent: () => ({ subject: "Updates", htmlBody: "<p>Hi</p>" }),
      newContactSettleMs: 0,
      logEvent: silentLog,
    });

    expect(stats.providersSent).toBe(1);
    expect(syncProviderContactMock).toHaveBeenCalledWith(
      expect.objectContaining({ providerUserId: "maple" }),
    );
    // Addressed by the id the sync produced, not the null row value.
    expect(createMessage).toHaveBeenCalledWith(
      expect.objectContaining({ to: { type: "user", id: "ic-new" } }),
      undefined,
    );
    expect(markProviderUserMock).toHaveBeenCalledWith(mockPrisma, "maple", now);
  });

  it("settles once per page, not once per newly created contact", async () => {
    const now = new Date("2026-03-10T18:00:00.000Z");
    const rows = ["a", "b", "c", "d"].map((id) => ({
      id,
      intercomContactId: null,
      email: `${id}@example.test`,
      name: id.toUpperCase(),
      pseudonymizedId: null,
    }));
    listProviderUsersMock.mockResolvedValueOnce(rows).mockResolvedValueOnce([]);

    // Every contact is created before any message is sent, so one settle covers
    // the page — the last contact created still waits the full interval.
    const order: string[] = [];
    syncProviderContactMock.mockImplementation(({ providerUserId }) => {
      order.push(`resolve:${providerUserId}`);
      return Promise.resolve({
        status: "created",
        providerUserId,
        contactId: `ic-${providerUserId}`,
      });
    });
    const createMessage = vi.fn().mockImplementation((payload) => {
      order.push(`send:${payload.to.id}`);
      return Promise.resolve({ status: 200, data: { id: "msg" } });
    });

    const stats = await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      createMessage,
      getAdminId: () => "99",
      buildEmailContent: () => ({ subject: "Updates", htmlBody: "<p>Hi</p>" }),
      // Left at the default so the phase ordering, not a zeroed wait, is proven.
      newContactSettleMs: 1,
      logEvent: silentLog,
    });

    expect(stats.providersSent).toBe(4);
    expect(order).toEqual([
      "resolve:a",
      "resolve:b",
      "resolve:c",
      "resolve:d",
      "send:ic-a",
      "send:ic-b",
      "send:ic-c",
      "send:ic-d",
    ]);
  });

  it("does not settle when every row already has a contact id", async () => {
    const now = new Date("2026-03-10T18:00:00.000Z");
    listProviderUsersMock
      .mockResolvedValueOnce([syncedProvider])
      .mockResolvedValueOnce([]);

    const stats = await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      createMessage: vi
        .fn()
        .mockResolvedValue({ status: 200, data: { id: "msg-1" } }),
      getAdminId: () => "99",
      buildEmailContent: () => ({ subject: "Updates", htmlBody: "<p>Hi</p>" }),
      // A settle this long would time the test out if it were ever awaited.
      newContactSettleMs: 60_000,
      logEvent: silentLog,
    });

    expect(stats.providersSent).toBe(1);
    expect(syncProviderContactMock).not.toHaveBeenCalled();
  });

  it("leaves a provider eligible when the contact cannot be created", async () => {
    const now = new Date("2026-03-10T18:00:00.000Z");
    listProviderUsersMock
      .mockResolvedValueOnce([
        {
          id: "maple",
          intercomContactId: null,
          email: "maple@example.test",
          name: "Jane Doe",
          pseudonymizedId: null,
        },
      ])
      .mockResolvedValueOnce([]);
    // syncProviderContact reports failure rather than throwing.
    syncProviderContactMock.mockResolvedValue({
      status: "failed",
      providerUserId: "maple",
      code: "intercom_upstream_unavailable",
    });
    const createMessage = vi.fn();
    const events: Record<string, unknown>[] = [];

    const stats = await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      createMessage,
      getAdminId: () => "99",
      buildEmailContent: () => ({ subject: "Updates", htmlBody: "<p>Hi</p>" }),
      newContactSettleMs: 0,
      logEvent: (event) => {
        events.push(event);
      },
    });

    expect(stats.providersFailed).toBe(1);
    expect(createMessage).not.toHaveBeenCalled();
    expect(markProviderUserMock).not.toHaveBeenCalled();

    // The mapped code must reach the queryable `code` field, not just the
    // free-text message — a plain Error here would report `unknown_error`.
    const failure = events.find(
      (event) => event["event"] === "send" && event["status"] === "failed",
    );
    expect(failure).toMatchObject({
      audience: "provider",
      providerUserId: "maple",
      code: "intercom_upstream_unavailable",
    });
  });

  it.each([
    ["disabled", "intercom_sync_disabled"],
    ["ineligible", "intercom_contact_ineligible"],
    ["skipped", "intercom_contact_unresolved"],
  ])(
    "reports a stable code when provider contact resolution ends %s",
    async (status, expectedCode) => {
      const now = new Date("2026-03-10T18:00:00.000Z");
      listProviderUsersMock
        .mockResolvedValueOnce([
          {
            id: "maple",
            intercomContactId: null,
            email: "maple@example.test",
            name: "Jane Doe",
            pseudonymizedId: null,
          },
        ])
        .mockResolvedValueOnce([]);
      // These statuses carry no `code` of their own.
      syncProviderContactMock.mockResolvedValue({
        status,
        providerUserId: "maple",
      });
      const events: Record<string, unknown>[] = [];

      const stats = await runHousingDigest({
        prisma: mockPrisma as never,
        now,
        createMessage: vi.fn(),
        getAdminId: () => "99",
        buildEmailContent: () => ({
          subject: "Updates",
          htmlBody: "<p>Hi</p>",
        }),
        newContactSettleMs: 0,
        logEvent: (event) => {
          events.push(event);
        },
      });

      expect(stats.providersFailed).toBe(1);
      expect(
        events.find(
          (event) => event["event"] === "send" && event["status"] === "failed",
        ),
      ).toMatchObject({ providerUserId: "maple", code: expectedCode });
    },
  );

  it("breaks out a 403 send failure as unauthorized without failing the whole page", async () => {
    const now = new Date("2026-03-10T18:00:00.000Z");
    const suppressed = {
      id: "p-suppressed",
      intercomContactId: "ic-suppressed",
      email: "suppressed@example.test",
      name: "John Doe",
      pseudonymizedId: "prov-suppressed",
    };
    listProviderUsersMock
      .mockResolvedValueOnce([syncedProvider, suppressed])
      .mockResolvedValueOnce([]);

    const createMessage = vi.fn().mockImplementation(({ to }) => {
      if (to.id === "ic-suppressed") {
        return Promise.reject(
          new IntercomApiError("Intercom POST /messages failed with 403", {
            status: 403,
            code: "intercom_unauthorized",
            retryable: false,
          }),
        );
      }
      return Promise.resolve({ status: 200, data: { id: "msg-1" } });
    });

    const stats = await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      createMessage,
      getAdminId: () => "99",
      buildEmailContent: () => ({ subject: "Updates", htmlBody: "<p>Hi</p>" }),
      newContactSettleMs: 0,
      logEvent: silentLog,
    });

    expect(stats.providersSent).toBe(1);
    expect(stats.providersFailed).toBe(1);
    expect(stats.providersFailedPermanent).toBe(1);
    expect(markProviderUserMock).toHaveBeenCalledWith(mockPrisma, "p1", now);
    expect(markProviderUserMock).not.toHaveBeenCalledWith(
      mockPrisma,
      "p-suppressed",
      now,
    );
  });

  it("breaks out a permanent contact-resolution failure without failing the whole page", async () => {
    const now = new Date("2026-03-10T18:00:00.000Z");
    const suppressed = {
      id: "p-suppressed",
      intercomContactId: null,
      email: "suppressed@example.test",
      name: "John Doe",
      pseudonymizedId: "prov-suppressed",
    };
    listProviderUsersMock
      .mockResolvedValueOnce([syncedProvider, suppressed])
      .mockResolvedValueOnce([]);
    syncProviderContactMock.mockImplementation(({ providerUserId }) =>
      Promise.resolve(
        providerUserId === "p-suppressed"
          ? { status: "failed", providerUserId, code: "intercom_unauthorized" }
          : {
              status: "created",
              providerUserId,
              contactId: `ic-${providerUserId}`,
            },
      ),
    );
    const createMessage = vi
      .fn()
      .mockResolvedValue({ status: 200, data: { id: "msg-1" } });

    const stats = await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      createMessage,
      getAdminId: () => "99",
      buildEmailContent: () => ({ subject: "Updates", htmlBody: "<p>Hi</p>" }),
      newContactSettleMs: 0,
      logEvent: silentLog,
    });

    expect(stats.providersSent).toBe(1);
    expect(stats.providersFailed).toBe(1);
    expect(stats.providersFailedPermanent).toBe(1);
    expect(markProviderUserMock).not.toHaveBeenCalledWith(
      mockPrisma,
      "p-suppressed",
      now,
    );
  });

  it("creates a contact for a staff row whose login sync never landed", async () => {
    const now = new Date("2026-03-10T18:00:00.000Z");
    listStaffMock
      .mockResolvedValueOnce([
        {
          id: "s2",
          intercomContactId: null,
          email: "cm@example.test",
          name: null,
          pseudonymizedId: "staff-2",
        },
      ])
      .mockResolvedValueOnce([]);
    upsertContactMock.mockResolvedValue({
      status: "created",
      contactId: "ic-s2",
    });

    const stats = await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      createMessage: vi
        .fn()
        .mockResolvedValue({ status: 200, data: { id: "msg-s" } }),
      getAdminId: () => "99",
      buildEmailContent: () => ({ subject: "Updates", htmlBody: "<p>Hi</p>" }),
      newContactSettleMs: 0,
      logEvent: silentLog,
    });

    expect(stats.staffSent).toBe(1);
    expect(setStaffIntercomSyncMock).toHaveBeenCalledWith(mockPrisma, "s2", {
      intercomContactId: "ic-s2",
    });
    // Namespaced external id, built from pseudonymizedId — never the row id.
    expect(upsertContactMock).toHaveBeenCalledWith(
      { email: "cm@example.test", externalId: "staff:staff-2" },
      undefined,
    );
  });

  it("records a DigestSendAttempt row for both a resolve failure and a send success", async () => {
    const now = new Date("2026-03-10T18:00:00.000Z");
    const suppressed = {
      id: "p-suppressed",
      intercomContactId: null,
      email: "suppressed@example.test",
      name: "John Doe",
      pseudonymizedId: "prov-suppressed",
    };
    listProviderUsersMock
      .mockResolvedValueOnce([syncedProvider, suppressed])
      .mockResolvedValueOnce([]);
    syncProviderContactMock.mockResolvedValue({
      status: "failed",
      providerUserId: "p-suppressed",
      code: "intercom_unauthorized",
    });
    const createMessage = vi
      .fn()
      .mockResolvedValue({ status: 200, data: { id: "msg-1" } });

    await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      createMessage,
      getAdminId: () => "99",
      buildEmailContent: () => ({ subject: "Updates", htmlBody: "<p>Hi</p>" }),
      newContactSettleMs: 0,
      logEvent: silentLog,
    });

    expect(digestSendAttemptCreateManyMock).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          audience: "PROVIDER",
          recipientId: "p1",
          outcome: "SENT",
          errorCode: null,
          intercomContactId: "ic-1",
          isRetry: false,
        }),
        expect.objectContaining({
          audience: "PROVIDER",
          recipientId: "p-suppressed",
          outcome: "FAILED",
          errorCode: "intercom_unauthorized",
          isRetry: false,
        }),
      ]),
    });
    const [[{ data: attempts }]] = digestSendAttemptCreateManyMock.mock.calls;
    expect(attempts).toHaveLength(2);
  });

  it("retries a freshly-created contact's rate-limited send once and counts a later success as sent", async () => {
    const now = new Date("2026-03-10T18:00:00.000Z");
    listProviderUsersMock
      .mockResolvedValueOnce([
        {
          id: "maple",
          intercomContactId: null,
          email: "maple@example.test",
          name: "Jane Doe",
          pseudonymizedId: null,
        },
      ])
      .mockResolvedValueOnce([]);
    syncProviderContactMock.mockResolvedValue({
      status: "created",
      providerUserId: "maple",
      contactId: "ic-new",
    });
    const createMessage = vi
      .fn()
      .mockRejectedValueOnce(
        new IntercomApiError("Intercom POST /messages failed with 429", {
          status: 429,
          code: "intercom_rate_limited",
          retryable: true,
        }),
      )
      .mockResolvedValueOnce({ status: 200, data: { id: "msg-retry" } });

    const stats = await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      createMessage,
      getAdminId: () => "99",
      buildEmailContent: () => ({ subject: "Updates", htmlBody: "<p>Hi</p>" }),
      newContactSettleMs: 0,
      logEvent: silentLog,
    });

    expect(createMessage).toHaveBeenCalledTimes(2);
    expect(stats.providersSent).toBe(1);
    expect(stats.providersFailed).toBe(0);
    expect(markProviderUserMock).toHaveBeenCalledTimes(1);
    expect(markProviderUserMock).toHaveBeenCalledWith(mockPrisma, "maple", now);

    const [[{ data: attempts }]] = digestSendAttemptCreateManyMock.mock.calls;
    expect(attempts).toEqual([
      expect.objectContaining({
        recipientId: "maple",
        outcome: "FAILED",
        errorCode: "intercom_rate_limited",
        isRetry: false,
      }),
      expect.objectContaining({
        recipientId: "maple",
        outcome: "SENT",
        errorCode: null,
        isRetry: true,
      }),
    ]);
  });

  it("does not retry a 5xx send failure, even for a freshly-created contact", async () => {
    const now = new Date("2026-03-10T18:00:00.000Z");
    listProviderUsersMock
      .mockResolvedValueOnce([
        {
          id: "maple",
          intercomContactId: null,
          email: "maple@example.test",
          name: "Jane Doe",
          pseudonymizedId: null,
        },
      ])
      .mockResolvedValueOnce([]);
    syncProviderContactMock.mockResolvedValue({
      status: "created",
      providerUserId: "maple",
      contactId: "ic-new",
    });
    const createMessage = vi.fn().mockRejectedValue(
      new IntercomApiError("Intercom POST /messages failed with 503", {
        status: 503,
        code: "intercom_upstream_unavailable",
        retryable: true,
      }),
    );

    const stats = await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      createMessage,
      getAdminId: () => "99",
      buildEmailContent: () => ({ subject: "Updates", htmlBody: "<p>Hi</p>" }),
      newContactSettleMs: 0,
      logEvent: silentLog,
    });

    expect(createMessage).toHaveBeenCalledTimes(1);
    expect(stats.providersFailed).toBe(1);
    expect(stats.providersFailedPermanent).toBe(0);
    expect(markProviderUserMock).not.toHaveBeenCalled();
  });

  describe("404 from Intercom's create -> messageable delay", () => {
    const resolvedThisRun = {
      id: "maple",
      intercomContactId: null,
      email: "maple@example.test",
      name: "Jane Doe",
      pseudonymizedId: null,
    };
    const notFound = () =>
      new IntercomApiError("Intercom POST /messages failed with 404", {
        status: 404,
        code: "intercom_not_found",
        retryable: false,
      });

    beforeEach(() => {
      syncProviderContactMock.mockResolvedValue({
        status: "created",
        providerUserId: "maple",
        contactId: "ic-new",
      });
    });

    it("retries once for a contact resolved this run and counts a later success as sent", async () => {
      const now = new Date("2026-03-10T18:00:00.000Z");
      listProviderUsersMock
        .mockResolvedValueOnce([resolvedThisRun])
        .mockResolvedValueOnce([]);
      const createMessage = vi
        .fn()
        .mockRejectedValueOnce(notFound())
        .mockResolvedValueOnce({ status: 200, data: { id: "msg-retry" } });

      const stats = await runHousingDigest({
        prisma: mockPrisma as never,
        now,
        createMessage,
        getAdminId: () => "99",
        buildEmailContent: () => ({
          subject: "Updates",
          htmlBody: "<p>Hi</p>",
        }),
        newContactSettleMs: 0,
        logEvent: silentLog,
      });

      expect(createMessage).toHaveBeenCalledTimes(2);
      expect(stats.providersSent).toBe(1);
      expect(stats.providersFailed).toBe(0);
      expect(markProviderUserMock).toHaveBeenCalledTimes(1);
      expect(markProviderUserMock).toHaveBeenCalledWith(
        mockPrisma,
        "maple",
        now,
      );
      const [[{ data: attempts }]] = digestSendAttemptCreateManyMock.mock.calls;
      expect(attempts).toEqual([
        expect.objectContaining({
          recipientId: "maple",
          outcome: "FAILED",
          errorCode: "intercom_not_found",
          isRetry: false,
        }),
        expect.objectContaining({
          recipientId: "maple",
          outcome: "SENT",
          errorCode: null,
          isRetry: true,
        }),
      ]);
    });

    it("counts a recipient failed, not permanently, when the retry also gets a 404", async () => {
      const now = new Date("2026-03-10T18:00:00.000Z");
      listProviderUsersMock
        .mockResolvedValueOnce([resolvedThisRun])
        .mockResolvedValueOnce([]);
      const createMessage = vi.fn().mockRejectedValue(notFound());

      const stats = await runHousingDigest({
        prisma: mockPrisma as never,
        now,
        createMessage,
        getAdminId: () => "99",
        buildEmailContent: () => ({
          subject: "Updates",
          htmlBody: "<p>Hi</p>",
        }),
        newContactSettleMs: 0,
        logEvent: silentLog,
      });

      expect(createMessage).toHaveBeenCalledTimes(2);
      expect(stats.providersSent).toBe(0);
      expect(stats.providersFailed).toBe(1);
      expect(stats.providersFailedPermanent).toBe(0);
      expect(markProviderUserMock).not.toHaveBeenCalled();
      const [[{ data: attempts }]] = digestSendAttemptCreateManyMock.mock.calls;
      expect(attempts).toEqual([
        expect.objectContaining({
          outcome: "FAILED",
          errorCode: "intercom_not_found",
          isRetry: false,
        }),
        expect.objectContaining({
          outcome: "FAILED",
          errorCode: "intercom_not_found",
          isRetry: true,
        }),
      ]);
    });

    it("does not retry a returning contact that already had an Intercom id", async () => {
      const now = new Date("2026-03-10T18:00:00.000Z");
      listProviderUsersMock
        .mockResolvedValueOnce([syncedProvider])
        .mockResolvedValueOnce([]);
      const createMessage = vi.fn().mockRejectedValue(notFound());

      const stats = await runHousingDigest({
        prisma: mockPrisma as never,
        now,
        createMessage,
        getAdminId: () => "99",
        buildEmailContent: () => ({
          subject: "Updates",
          htmlBody: "<p>Hi</p>",
        }),
        newContactSettleMs: 0,
        logEvent: silentLog,
      });

      // A 404 for a stored contact id is a deleted or stale contact, not lag.
      expect(createMessage).toHaveBeenCalledTimes(1);
      expect(stats.providersFailed).toBe(1);
      expect(markProviderUserMock).not.toHaveBeenCalled();
    });
  });

  it("does not retry a permanent send failure even for a freshly-created contact", async () => {
    const now = new Date("2026-03-10T18:00:00.000Z");
    listProviderUsersMock
      .mockResolvedValueOnce([
        {
          id: "maple",
          intercomContactId: null,
          email: "maple@example.test",
          name: "Jane Doe",
          pseudonymizedId: null,
        },
      ])
      .mockResolvedValueOnce([]);
    syncProviderContactMock.mockResolvedValue({
      status: "created",
      providerUserId: "maple",
      contactId: "ic-new",
    });
    const createMessage = vi.fn().mockRejectedValue(
      new IntercomApiError("Intercom POST /messages failed with 401", {
        status: 401,
        code: "intercom_unauthorized",
        retryable: false,
      }),
    );

    const stats = await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      createMessage,
      getAdminId: () => "99",
      buildEmailContent: () => ({ subject: "Updates", htmlBody: "<p>Hi</p>" }),
      newContactSettleMs: 0,
      logEvent: silentLog,
    });

    expect(createMessage).toHaveBeenCalledTimes(1);
    expect(stats.providersFailed).toBe(1);
    expect(stats.providersFailedPermanent).toBe(1);
    const [[{ data: attempts }]] = digestSendAttemptCreateManyMock.mock.calls;
    expect(attempts).toEqual([
      expect.objectContaining({
        recipientId: "maple",
        outcome: "FAILED",
        isRetry: false,
      }),
    ]);
  });

  it("does not retry an ambiguous-outcome failure, even for a freshly-created contact", async () => {
    const now = new Date("2026-03-10T18:00:00.000Z");
    listProviderUsersMock
      .mockResolvedValueOnce([
        {
          id: "maple",
          intercomContactId: null,
          email: "maple@example.test",
          name: "Jane Doe",
          pseudonymizedId: null,
        },
      ])
      .mockResolvedValueOnce([]);
    syncProviderContactMock.mockResolvedValue({
      status: "created",
      providerUserId: "maple",
      contactId: "ic-new",
    });
    // A 200 with no message id: Intercom's request handling succeeded, so a
    // retry here would risk creating a second real message.
    const createMessage = vi.fn().mockResolvedValue({ status: 200, data: {} });

    const stats = await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      createMessage,
      getAdminId: () => "99",
      buildEmailContent: () => ({ subject: "Updates", htmlBody: "<p>Hi</p>" }),
      newContactSettleMs: 0,
      logEvent: silentLog,
    });

    expect(createMessage).toHaveBeenCalledTimes(1);
    expect(stats.providersFailed).toBe(1);
    const [[{ data: attempts }]] = digestSendAttemptCreateManyMock.mock.calls;
    expect(attempts).toEqual([
      expect.objectContaining({
        recipientId: "maple",
        outcome: "FAILED",
        errorCode: "intercom_invalid_response",
        isRetry: false,
      }),
    ]);
  });

  it("does not retry a send failure for a recipient whose contact already existed", async () => {
    const now = new Date("2026-03-10T18:00:00.000Z");
    listProviderUsersMock
      .mockResolvedValueOnce([syncedProvider])
      .mockResolvedValueOnce([]);
    const createMessage = vi.fn().mockRejectedValue(
      new IntercomApiError("Intercom POST /messages failed with 503", {
        status: 503,
        code: "intercom_upstream_unavailable",
        retryable: true,
      }),
    );

    const stats = await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      createMessage,
      getAdminId: () => "99",
      buildEmailContent: () => ({ subject: "Updates", htmlBody: "<p>Hi</p>" }),
      newContactSettleMs: 0,
      logEvent: silentLog,
    });

    // contactResolved is false here — the contact already existed before this
    // run, so a send failure can't be blamed on create -> messageable lag.
    expect(createMessage).toHaveBeenCalledTimes(1);
    expect(stats.providersFailed).toBe(1);
  });

  it("does not let a failed attempt-log write abort the run", async () => {
    const now = new Date("2026-03-10T18:00:00.000Z");
    listProviderUsersMock
      .mockResolvedValueOnce([syncedProvider])
      .mockResolvedValueOnce([]);
    digestSendAttemptCreateManyMock.mockRejectedValueOnce(
      new Error("connection reset"),
    );
    const events: Record<string, unknown>[] = [];

    const stats = await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      createMessage: vi
        .fn()
        .mockResolvedValue({ status: 200, data: { id: "msg-1" } }),
      getAdminId: () => "99",
      buildEmailContent: () => ({ subject: "Updates", htmlBody: "<p>Hi</p>" }),
      newContactSettleMs: 0,
      logEvent: (event) => {
        events.push(event);
      },
    });

    // The actual send and DB markSent already happened — losing the audit
    // trail must not turn a real success into a reported failure.
    expect(stats.providersSent).toBe(1);
    expect(stats.providersFailed).toBe(0);
    expect(markProviderUserMock).toHaveBeenCalledWith(mockPrisma, "p1", now);
    expect(
      events.find((event) => event["event"] === "attempt_log_failed"),
    ).toMatchObject({ audience: "provider", count: 1 });
  });

  it("does not resend when markSent fails after Intercom already accepted the message", async () => {
    const now = new Date("2026-03-10T18:00:00.000Z");
    listProviderUsersMock
      .mockResolvedValueOnce([
        {
          id: "maple",
          intercomContactId: null,
          email: "maple@example.test",
          name: "Jane Doe",
          pseudonymizedId: null,
        },
      ])
      .mockResolvedValueOnce([]);
    syncProviderContactMock.mockResolvedValue({
      status: "created",
      providerUserId: "maple",
      contactId: "ic-new",
    });
    const createMessage = vi
      .fn()
      .mockResolvedValue({ status: 200, data: { id: "msg-1" } });
    markProviderUserMock.mockRejectedValue(new Error("connection reset"));
    const events: Record<string, unknown>[] = [];

    const stats = await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      createMessage,
      getAdminId: () => "99",
      buildEmailContent: () => ({ subject: "Updates", htmlBody: "<p>Hi</p>" }),
      newContactSettleMs: 0,
      markSentRetryDelayMs: 0,
      logEvent: (event) => {
        events.push(event);
      },
    });

    expect(createMessage).toHaveBeenCalledTimes(1);
    expect(markProviderUserMock).toHaveBeenCalledTimes(3);
    expect(stats.providersSent).toBe(1);
    expect(stats.providersFailed).toBe(0);
    expect(stats.providersMarkSentFailed).toBe(1);
    expect(
      events.find((event) => event["event"] === "mark_sent_failed"),
    ).toMatchObject({
      audience: "provider",
      providerUserId: "maple",
      attempts: 3,
    });
  });

  it("recovers a transient markSent failure without reporting it", async () => {
    const now = new Date("2026-03-10T18:00:00.000Z");
    listProviderUsersMock
      .mockResolvedValueOnce([syncedProvider])
      .mockResolvedValueOnce([]);
    markProviderUserMock.mockRejectedValueOnce(new Error("connection reset"));
    const events: Record<string, unknown>[] = [];

    const stats = await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      createMessage: vi
        .fn()
        .mockResolvedValue({ status: 200, data: { id: "msg-1" } }),
      getAdminId: () => "99",
      buildEmailContent: () => ({ subject: "Updates", htmlBody: "<p>Hi</p>" }),
      newContactSettleMs: 0,
      markSentRetryDelayMs: 0,
      logEvent: (event) => {
        events.push(event);
      },
    });

    expect(markProviderUserMock).toHaveBeenCalledTimes(2);
    expect(stats.providersSent).toBe(1);
    expect(stats.providersMarkSentFailed).toBe(0);
    expect(
      events.find((event) => event["event"] === "mark_sent_failed"),
    ).toBeUndefined();
  });

  it("counts a staff markSent failure and still counts the recipient as sent", async () => {
    const now = new Date("2026-03-10T18:00:00.000Z");
    listProviderUsersMock.mockResolvedValue([]);
    listStaffMock
      .mockResolvedValueOnce([
        {
          id: "s1",
          intercomContactId: "ic-s1",
          email: "s1@example.test",
          name: null,
          pseudonymizedId: "staff-1",
        },
      ])
      .mockResolvedValueOnce([]);
    markStaffMock.mockRejectedValue(new Error("connection reset"));
    const events: Record<string, unknown>[] = [];

    const stats = await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      createMessage: vi
        .fn()
        .mockResolvedValue({ status: 200, data: { id: "msg-s" } }),
      getAdminId: () => "99",
      buildEmailContent: () => ({ subject: "Updates", htmlBody: "<p>Hi</p>" }),
      newContactSettleMs: 0,
      markSentRetryDelayMs: 0,
      logEvent: (event) => {
        events.push(event);
      },
    });

    expect(markStaffMock).toHaveBeenCalledTimes(3);
    expect(stats.staffSent).toBe(1);
    expect(stats.staffFailed).toBe(0);
    expect(stats.staffMarkSentFailed).toBe(1);
    expect(stats.providersMarkSentFailed).toBe(0);
    expect(
      events.find((event) => event["event"] === "mark_sent_failed"),
    ).toMatchObject({ audience: "staff", staffId: "s1", attempts: 3 });
  });

  it("makes exactly one POST /messages when Intercom answers 503, even for a freshly-created contact", async () => {
    const now = new Date("2026-03-10T18:00:00.000Z");
    listProviderUsersMock
      .mockResolvedValueOnce([
        {
          id: "maple",
          intercomContactId: null,
          email: "maple@example.test",
          name: "Jane Doe",
          pseudonymizedId: null,
        },
      ])
      .mockResolvedValueOnce([]);
    syncProviderContactMock.mockResolvedValue({
      status: "created",
      providerUserId: "maple",
      contactId: "ic-new",
    });
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ errors: [{ message: "busy" }] }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const stats = await runHousingDigest({
      prisma: mockPrisma as never,
      now,
      requestOptions: {
        token: "t",
        baseUrl: "https://api.intercom.io",
        fetchFn,
      },
      getAdminId: () => "99",
      buildEmailContent: () => ({ subject: "Updates", htmlBody: "<p>Hi</p>" }),
      newContactSettleMs: 0,
      logEvent: silentLog,
    });

    // Not injecting createMessage, so this runs the real intercomCreateMessage
    // policy and the digest's own retry together: neither may resend a 503.
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.intercom.io/messages",
      expect.objectContaining({ method: "POST" }),
    );
    expect(stats.providersSent).toBe(0);
    expect(stats.providersFailed).toBe(1);
    expect(markProviderUserMock).not.toHaveBeenCalled();
  });
});

describe("hasOperationalFailure", () => {
  it("is false with no failures", () => {
    expect(
      hasOperationalFailure({ sent: 5, failed: 0, failedPermanent: 0 }, 5),
    ).toBe(false);
  });

  it("is true when a non-permanent failure exists alongside sends", () => {
    expect(
      hasOperationalFailure({ sent: 4, failed: 1, failedPermanent: 0 }, 5),
    ).toBe(true);
  });

  it("is true when a non-permanent failure exists with zero sends", () => {
    expect(
      hasOperationalFailure({ sent: 0, failed: 1, failedPermanent: 0 }, 5),
    ).toBe(true);
  });

  it("is false for an isolated permanent failure alongside other sends", () => {
    expect(
      hasOperationalFailure({ sent: 4, failed: 1, failedPermanent: 1 }, 5),
    ).toBe(false);
  });

  it("is false for a single permanent failure at zero sends when the other audience sent", () => {
    expect(
      hasOperationalFailure({ sent: 0, failed: 1, failedPermanent: 1 }, 5),
    ).toBe(false);
  });

  it("is true for a single permanent failure at zero sends when the other audience also sent nothing", () => {
    expect(
      hasOperationalFailure({ sent: 0, failed: 1, failedPermanent: 1 }, 0),
    ).toBe(true);
  });

  it("is true for multiple permanent failures at zero sends regardless of the other audience", () => {
    expect(
      hasOperationalFailure({ sent: 0, failed: 2, failedPermanent: 2 }, 5),
    ).toBe(true);
  });
});
