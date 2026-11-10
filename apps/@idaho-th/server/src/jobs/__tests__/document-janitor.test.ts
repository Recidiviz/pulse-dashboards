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
const getPrismaClientForStateCodeMock = vi.hoisted(() => vi.fn());
const runDocumentJanitorMock = vi.hoisted(() => vi.fn());
const ensureGcsStorageInitializedMock = vi.hoisted(() => vi.fn());

vi.mock("@sentry/node", () => ({
  captureMessage: captureMessageMock,
}));

vi.mock("~@idaho-th/prisma", () => ({
  getPrismaClientForStateCode: getPrismaClientForStateCodeMock,
}));

vi.mock("~@idaho-th/trpc/documentJanitor/documentJanitor.service", () => ({
  runDocumentJanitor: runDocumentJanitorMock,
}));

vi.mock("~@idaho-th/trpc/storage/gcs", () => ({
  ensureGcsStorageInitialized: ensureGcsStorageInitializedMock,
}));

import { main } from "~@idaho-th/server/jobs/document-janitor";

const CLEAN_RUN = {
  expiredIntakeShells: 0,
  expiredInfectedIntakeShells: 0,
  expiredPendingDocuments: 0,
  failedIntakeShells: 0,
  failedPendingDocuments: 0,
  stuckScanDocuments: 0,
};

let consoleInfo: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  consoleInfo = vi.spyOn(console, "info").mockImplementation(() => undefined);
  runDocumentJanitorMock.mockResolvedValue(CLEAN_RUN);
  getPrismaClientForStateCodeMock.mockReturnValue({});
  ensureGcsStorageInitializedMock.mockResolvedValue(undefined);
});

afterEach(() => {
  consoleInfo.mockRestore();
  process.exitCode = undefined;
});

/** Every JSON line the job logged, parsed. */
function loggedEvents(): unknown[] {
  return consoleInfo.mock.calls.map(([line]) => JSON.parse(String(line)));
}

describe("document-janitor job", () => {
  it("initializes the GCS client before running the sweep", async () => {
    // This job runs as a standalone Cloud Run Job, not through the Fastify
    // server's main.ts — without this, every GCS delete in the sweep throws
    // "GCS Storage client is not initialized".
    const order: string[] = [];
    ensureGcsStorageInitializedMock.mockImplementation(async () => {
      order.push("init");
    });
    runDocumentJanitorMock.mockImplementation(async () => {
      order.push("sweep");
      return CLEAN_RUN;
    });

    await main();

    expect(ensureGcsStorageInitializedMock).toHaveBeenCalledTimes(1);
    expect(order).toEqual(["init", "sweep"]);
  });

  it("logs start and completion with the sweep counts", async () => {
    const result = {
      ...CLEAN_RUN,
      expiredIntakeShells: 2,
      expiredPendingDocuments: 3,
      stuckScanDocuments: 4,
    };
    runDocumentJanitorMock.mockResolvedValue(result);

    await main();

    const events = loggedEvents();
    expect(events[0]).toEqual({ job: "document-janitor", event: "start" });
    expect(events.at(-1)).toEqual({
      job: "document-janitor",
      event: "complete",
      ...result,
    });
  });

  it("leaves the exit code alone on a clean run", async () => {
    await main();

    expect(process.exitCode).toBeUndefined();
  });

  it.each([
    ["an intake shell", { failedIntakeShells: 1 }],
    ["a pending document", { failedPendingDocuments: 1 }],
  ])(
    "fails the execution when %s could not be swept",
    async (_label, failures) => {
      runDocumentJanitorMock.mockResolvedValue({ ...CLEAN_RUN, ...failures });

      await main();

      expect(process.exitCode).toBe(1);
    },
  );

  it("reports a failed sweep to Sentry as an error with the counts", async () => {
    const result = { ...CLEAN_RUN, failedIntakeShells: 1 };
    runDocumentJanitorMock.mockResolvedValue(result);

    await main();

    expect(captureMessageMock).toHaveBeenCalledWith(
      "Document janitor failed to sweep some shells/documents",
      { level: "error", extra: result },
    );
  });

  it("neither alerts nor fails on stuck scans alone — the log alert covers them", async () => {
    runDocumentJanitorMock.mockResolvedValue({
      ...CLEAN_RUN,
      stuckScanDocuments: 3,
    });

    await main();

    expect(captureMessageMock).not.toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
  });

  it("does not alert when nothing was swept", async () => {
    await main();

    expect(captureMessageMock).not.toHaveBeenCalled();
  });

  it("alerts when intake shells were swept — a crash left something to clean up", async () => {
    const result = { ...CLEAN_RUN, expiredIntakeShells: 1 };
    runDocumentJanitorMock.mockResolvedValue(result);

    await main();

    expect(captureMessageMock).toHaveBeenCalledWith(
      "Document janitor swept orphaned shells/documents",
      expect.objectContaining({ level: "warning", extra: result }),
    );
  });

  it("alerts when pending documents were swept", async () => {
    runDocumentJanitorMock.mockResolvedValue({
      ...CLEAN_RUN,
      expiredPendingDocuments: 1,
    });

    await main();

    expect(captureMessageMock).toHaveBeenCalledTimes(1);
  });

  it("never logs an id — only counts reach the log line", async () => {
    runDocumentJanitorMock.mockResolvedValue({
      expiredIntakeShells: 5,
      expiredInfectedIntakeShells: 1,
      expiredPendingDocuments: 7,
      failedIntakeShells: 2,
      failedPendingDocuments: 3,
      stuckScanDocuments: 4,
    });

    await main();

    // Every logged value here should be the job name, an event name, or a
    // plain count — never a UUID-shaped identifier.
    const logged = JSON.stringify(loggedEvents());
    expect(logged).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
  });
});
