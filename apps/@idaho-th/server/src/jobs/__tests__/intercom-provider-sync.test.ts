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

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const captureMessageMock = vi.hoisted(() => vi.fn());
const flushMock = vi.hoisted(() => vi.fn());
const getPrismaClientForStateCodeMock = vi.hoisted(() => vi.fn());
const isIntercomTokenConfiguredMock = vi.hoisted(() => vi.fn());
const syncAllProvidersMock = vi.hoisted(() => vi.fn());

vi.mock("@sentry/node", () => ({
  captureMessage: captureMessageMock,
  flush: flushMock,
}));

vi.mock("~@idaho-th/prisma", () => ({
  getPrismaClientForStateCode: getPrismaClientForStateCodeMock,
}));

vi.mock("~@idaho-th/trpc/intercom/intercom.config", () => ({
  isIntercomTokenConfigured: isIntercomTokenConfiguredMock,
}));

vi.mock("~@idaho-th/trpc/intercom/intercom.provider.sync", () => ({
  syncAllProviders: syncAllProvidersMock,
}));

import { main } from "~@idaho-th/server/jobs/intercom-provider-sync";
import {
  INTERCOM_ERROR_CODE,
  PROVIDER_SYNC_JOB_LOG,
} from "~@idaho-th/trpc/intercom/intercom.constants";

const cleanRun = {
  succeeded: 5,
  failed: 0,
  skipped: 2,
  results: [],
};

function failure(providerUserId: string, code: string) {
  return { status: "failed", providerUserId, code };
}

let consoleInfo: ReturnType<typeof vi.spyOn>;
let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  consoleInfo = vi.spyOn(console, "info").mockImplementation(() => undefined);
  consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  isIntercomTokenConfiguredMock.mockReturnValue(true);
  syncAllProvidersMock.mockResolvedValue(cleanRun);
  flushMock.mockResolvedValue(true);
  getPrismaClientForStateCodeMock.mockReturnValue({});
});

afterEach(() => {
  consoleInfo.mockRestore();
  consoleError.mockRestore();
  // main() signals failure by setting process.exitCode; leaving it set would
  // fail the whole vitest run.
  process.exitCode = undefined;
});

function loggedEvents(
  spy: ReturnType<typeof vi.spyOn>,
): Record<string, unknown>[] {
  return spy.mock.calls.map(
    ([line]) => JSON.parse(String(line)) as Record<string, unknown>,
  );
}

describe("intercom-provider-sync job", () => {
  it("aborts with a non-zero exit code when the Intercom token is missing", async () => {
    isIntercomTokenConfiguredMock.mockReturnValue(false);

    await main();

    expect(syncAllProvidersMock).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
    expect(loggedEvents(consoleError)).toEqual([
      {
        job: PROVIDER_SYNC_JOB_LOG.JOB,
        event: PROVIDER_SYNC_JOB_LOG.EVENT_ABORT,
        reason: PROVIDER_SYNC_JOB_LOG.REASON_MISSING_ENV,
      },
    ]);
    expect(flushMock).toHaveBeenCalledWith(2000);
  });

  it("syncs without forcing, so an already-synced provider costs nothing", async () => {
    await main();

    expect(syncAllProvidersMock).toHaveBeenCalledWith({
      prisma: {},
      force: false,
    });
    expect(process.exitCode).toBeUndefined();
    expect(captureMessageMock).not.toHaveBeenCalled();
  });

  it("logs start and completion with the aggregate counts", async () => {
    await main();

    const events = loggedEvents(consoleInfo);

    expect(events[0]).toEqual({
      job: PROVIDER_SYNC_JOB_LOG.JOB,
      event: PROVIDER_SYNC_JOB_LOG.EVENT_START,
    });
    expect(events.at(-1)).toEqual({
      job: PROVIDER_SYNC_JOB_LOG.JOB,
      event: PROVIDER_SYNC_JOB_LOG.EVENT_COMPLETE,
      succeeded: 5,
      failed: 0,
      skipped: 2,
      failures: [],
    });
  });

  it("logs failures as provider user id and code only — never a name or email", async () => {
    syncAllProvidersMock.mockResolvedValue({
      succeeded: 1,
      failed: 1,
      skipped: 0,
      results: [
        {
          ...failure(
            "provider-user-1",
            INTERCOM_ERROR_CODE.UPSTREAM_UNAVAILABLE,
          ),
          email: "provider@example.com",
          name: "Jane Doe",
        },
        { status: "created", providerUserId: "provider-user-2" },
      ],
    });

    await main();

    const complete = loggedEvents(consoleInfo).at(-1);

    expect(complete?.["failures"]).toEqual([
      {
        providerUserId: "provider-user-1",
        code: INTERCOM_ERROR_CODE.UPSTREAM_UNAVAILABLE,
      },
    ]);
    expect(JSON.stringify(complete)).not.toContain("provider@example.com");
    expect(JSON.stringify(complete)).not.toContain("Jane Doe");
  });

  it("caps the logged failure list at 50 entries", async () => {
    const results = Array.from({ length: 60 }, (_unused, index) =>
      failure(
        `provider-user-${index}`,
        INTERCOM_ERROR_CODE.UPSTREAM_UNAVAILABLE,
      ),
    );
    syncAllProvidersMock.mockResolvedValue({
      succeeded: 0,
      failed: 60,
      skipped: 0,
      results,
    });

    await main();

    expect(loggedEvents(consoleInfo).at(-1)?.["failures"]).toHaveLength(50);
  });

  it("reports and fails when the failures are operational", async () => {
    syncAllProvidersMock.mockResolvedValue({
      succeeded: 0,
      failed: 2,
      skipped: 0,
      results: [
        failure("provider-1", INTERCOM_ERROR_CODE.UPSTREAM_UNAVAILABLE),
        failure("provider-2", INTERCOM_ERROR_CODE.UPSTREAM_UNAVAILABLE),
      ],
    });

    await main();

    expect(process.exitCode).toBe(1);
    expect(captureMessageMock).toHaveBeenCalledWith(
      "Intercom provider sync job completed with failures",
      expect.objectContaining({
        level: "error",
        extra: { succeeded: 0, failed: 2, failedPermanent: 0 },
      }),
    );
  });

  it("does not fail the job when every failure was a permanent rejection", async () => {
    syncAllProvidersMock.mockResolvedValue({
      succeeded: 3,
      failed: 1,
      skipped: 0,
      results: [failure("provider-1", INTERCOM_ERROR_CODE.CONTACT_INELIGIBLE)],
    });

    await main();

    expect(process.exitCode).toBeUndefined();
    expect(captureMessageMock).not.toHaveBeenCalled();
  });
});
