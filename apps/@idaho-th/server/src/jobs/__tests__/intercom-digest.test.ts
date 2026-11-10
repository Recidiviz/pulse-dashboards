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
const isIntercomEnvConfiguredMock = vi.hoisted(() => vi.fn());
const runHousingDigestMock = vi.hoisted(() => vi.fn());

vi.mock("@sentry/node", () => ({
  captureMessage: captureMessageMock,
  flush: flushMock,
}));

vi.mock("~@idaho-th/prisma", () => ({
  getPrismaClientForStateCode: getPrismaClientForStateCodeMock,
}));

vi.mock("~@idaho-th/trpc/intercom/intercom.config", () => ({
  isIntercomEnvConfigured: isIntercomEnvConfiguredMock,
}));

vi.mock("~@idaho-th/trpc/intercom/intercom.digest", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("~@idaho-th/trpc/intercom/intercom.digest")
  >()),
  runHousingDigest: runHousingDigestMock,
}));

import { main } from "~@idaho-th/server/jobs/intercom-digest";
import { DIGEST_JOB_LOG } from "~@idaho-th/trpc/intercom/intercom.constants";

const cleanRun = {
  providersSent: 3,
  providersFailed: 0,
  providersFailedPermanent: 0,
  staffSent: 4,
  staffFailed: 0,
  staffFailedPermanent: 0,
  providersMarkSentFailed: 0,
  staffMarkSentFailed: 0,
  skippedWeekend: false,
};

let consoleInfo: ReturnType<typeof vi.spyOn>;
let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  consoleInfo = vi.spyOn(console, "info").mockImplementation(() => undefined);
  consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  isIntercomEnvConfiguredMock.mockReturnValue(true);
  runHousingDigestMock.mockResolvedValue(cleanRun);
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

/** Every JSON line the job logged, parsed. */
function loggedEvents(spy: ReturnType<typeof vi.spyOn>): unknown[] {
  return spy.mock.calls.map(([line]) => JSON.parse(String(line)));
}

describe("intercom-digest job", () => {
  it("aborts with a non-zero exit code when the Intercom env is missing", async () => {
    isIntercomEnvConfiguredMock.mockReturnValue(false);

    await main();

    expect(runHousingDigestMock).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
    expect(loggedEvents(consoleError)).toEqual([
      {
        job: DIGEST_JOB_LOG.JOB,
        event: DIGEST_JOB_LOG.EVENT_ABORT,
        reason: DIGEST_JOB_LOG.REASON_MISSING_ENV,
      },
    ]);
    expect(captureMessageMock).toHaveBeenCalledWith(
      expect.stringContaining("Intercom digest job aborted"),
      "error",
    );
    // The Sentry report must be flushed before the process is allowed to end.
    expect(flushMock).toHaveBeenCalledWith(2000);
  });

  it("runs the digest and exits cleanly when nothing failed", async () => {
    await main();

    expect(runHousingDigestMock).toHaveBeenCalledTimes(1);
    expect(process.exitCode).toBeUndefined();
    expect(captureMessageMock).not.toHaveBeenCalled();
  });

  it("logs start and completion with the aggregate counts", async () => {
    await main();

    const events = loggedEvents(consoleInfo);

    expect(events[0]).toEqual({
      job: DIGEST_JOB_LOG.JOB,
      event: DIGEST_JOB_LOG.EVENT_START,
    });
    expect(events.at(-1)).toEqual({
      job: DIGEST_JOB_LOG.JOB,
      event: DIGEST_JOB_LOG.EVENT_COMPLETE,
      ...cleanRun,
    });
  });

  it("forwards the digest's own log events, tagged with the job name", async () => {
    runHousingDigestMock.mockImplementation(
      async ({ logEvent }: { logEvent: (event: unknown) => void }) => {
        logEvent({ event: "run", status: "skipped_weekend" });
        return { ...cleanRun, providersSent: 0, staffSent: 0 };
      },
    );

    await main();

    expect(loggedEvents(consoleInfo)).toContainEqual({
      job: DIGEST_JOB_LOG.JOB,
      event: "run",
      status: "skipped_weekend",
    });
  });

  it("never logs a recipient — only counts reach the log line", async () => {
    await main();

    const logged = JSON.stringify([
      ...loggedEvents(consoleInfo),
      ...loggedEvents(consoleError),
    ]);

    expect(logged).not.toMatch(/@/);
  });

  describe("failure reporting", () => {
    it("reports and fails when provider sends failed operationally", async () => {
      runHousingDigestMock.mockResolvedValue({
        ...cleanRun,
        providersSent: 0,
        providersFailed: 3,
        providersFailedPermanent: 0,
      });

      await main();

      expect(process.exitCode).toBe(1);
      expect(captureMessageMock).toHaveBeenCalledWith(
        "Intercom digest job completed with failures",
        expect.objectContaining({
          level: "error",
          tags: { intercomDigestTrippedAudiences: "providers" },
        }),
      );
    });

    it("names only staff when the provider sends were clean", async () => {
      runHousingDigestMock.mockResolvedValue({
        ...cleanRun,
        staffSent: 0,
        staffFailed: 2,
        staffFailedPermanent: 0,
      });

      await main();

      expect(process.exitCode).toBe(1);
      expect(captureMessageMock).toHaveBeenCalledWith(
        "Intercom digest job completed with failures",
        expect.objectContaining({
          tags: { intercomDigestTrippedAudiences: "staff" },
        }),
      );
    });

    it("names both audiences when both tripped", async () => {
      runHousingDigestMock.mockResolvedValue({
        providersSent: 0,
        providersFailed: 3,
        providersFailedPermanent: 0,
        staffSent: 0,
        staffFailed: 2,
        staffFailedPermanent: 0,
        providersMarkSentFailed: 0,
        staffMarkSentFailed: 0,
        skippedWeekend: false,
      });

      await main();

      expect(process.exitCode).toBe(1);
      expect(captureMessageMock).toHaveBeenCalledWith(
        "Intercom digest job completed with failures",
        expect.objectContaining({
          tags: { intercomDigestTrippedAudiences: "providers,staff" },
        }),
      );
    });

    it("warns without failing when the only failures were permanent rejections", async () => {
      runHousingDigestMock.mockResolvedValue({
        ...cleanRun,
        providersFailed: 1,
        providersFailedPermanent: 1,
        staffFailed: 2,
        staffFailedPermanent: 2,
      });

      await main();

      expect(process.exitCode).toBeUndefined();
      expect(captureMessageMock).toHaveBeenCalledWith(
        expect.stringContaining("permanently rejected by Intercom"),
        expect.objectContaining({ level: "warning" }),
      );
    });

    it("pluralizes the warning summary for a single recipient", async () => {
      runHousingDigestMock.mockResolvedValue({
        ...cleanRun,
        providersFailed: 1,
        providersFailedPermanent: 1,
        staffFailed: 1,
        staffFailedPermanent: 1,
      });

      await main();

      expect(captureMessageMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          extra: expect.objectContaining({
            summary: "1 provider and 1 staff member",
          }),
        }),
      );
    });

    it("pluralizes the warning summary for several recipients", async () => {
      runHousingDigestMock.mockResolvedValue({
        ...cleanRun,
        providersFailed: 2,
        providersFailedPermanent: 2,
        staffFailed: 3,
        staffFailedPermanent: 3,
      });

      await main();

      expect(captureMessageMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          extra: expect.objectContaining({
            summary: "2 providers and 3 staff members",
          }),
        }),
      );
    });

    it("reports and fails when a sent email could not be recorded as sent", async () => {
      runHousingDigestMock.mockResolvedValue({
        ...cleanRun,
        providersMarkSentFailed: 1,
      });

      await main();

      expect(process.exitCode).toBe(1);
      expect(captureMessageMock).toHaveBeenCalledWith(
        "Intercom digest sent emails it could not record as sent",
        expect.objectContaining({
          level: "error",
          extra: { providersMarkSentFailed: 1, staffMarkSentFailed: 0 },
        }),
      );
    });

    it("reports and fails when only staff sends could not be recorded as sent", async () => {
      runHousingDigestMock.mockResolvedValue({
        ...cleanRun,
        staffMarkSentFailed: 2,
      });

      await main();

      expect(process.exitCode).toBe(1);
      expect(captureMessageMock).toHaveBeenCalledWith(
        "Intercom digest sent emails it could not record as sent",
        expect.objectContaining({
          level: "error",
          extra: { providersMarkSentFailed: 0, staffMarkSentFailed: 2 },
        }),
      );
    });
  });
});
