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

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from "vitest";

const captureExceptionMock = vi.hoisted(() => vi.fn());
const captureMessageMock = vi.hoisted(() => vi.fn());
const flushMock = vi.hoisted(() => vi.fn());
const disconnectAllPrismaClientsMock = vi.hoisted(() => vi.fn());

vi.mock("@sentry/node", () => ({
  captureException: captureExceptionMock,
  captureMessage: captureMessageMock,
  flush: flushMock,
}));

vi.mock("~@idaho-th/prisma", () => ({
  disconnectAllPrismaClients: disconnectAllPrismaClientsMock,
}));

import { runJobEntryPoint } from "~@idaho-th/server/jobs/runJobEntryPoint";

let exitSpy: MockInstance<typeof process.exit>;
let consoleError: MockInstance<typeof console.error>;
let sigtermHandlers: (() => void)[];

beforeEach(() => {
  vi.clearAllMocks();
  flushMock.mockResolvedValue(true);
  disconnectAllPrismaClientsMock.mockResolvedValue(undefined);
  exitSpy = vi
    .spyOn(process, "exit")
    .mockImplementation((() => undefined) as never);
  consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  // Captured rather than registered, so no real SIGTERM listener outlives a test.
  sigtermHandlers = [];
  vi.spyOn(process, "on").mockImplementation(((
    event: string,
    handler: () => void,
  ) => {
    if (event === "SIGTERM") sigtermHandlers.push(handler);
    return process;
  }) as never);
});

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

describe("runJobEntryPoint", () => {
  it("exits 0 after a successful run, once Sentry and Prisma are closed", async () => {
    await runJobEntryPoint("Test job", async () => undefined);

    expect(flushMock).toHaveBeenCalledWith(2000);
    expect(disconnectAllPrismaClientsMock).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("keeps an exit code main() set itself", async () => {
    await runJobEntryPoint("Test job", async () => {
      process.exitCode = 1;
    });

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits 1 and reports to Sentry when main() throws", async () => {
    const error = new Error("boom");

    await runJobEntryPoint("Test job", async () => {
      throw error;
    });

    expect(captureExceptionMock).toHaveBeenCalledWith(error);
    expect(consoleError).toHaveBeenCalledWith(
      "Test job failed:",
      expect.anything(),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("still exits with the run's code when SIGTERM arrives during the final flush", async () => {
    let releaseFlush: () => void = () => undefined;
    flushMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseFlush = () => resolve(true);
        }),
    );

    const run = runJobEntryPoint("Test job", async () => {
      throw new Error("boom");
    });
    await vi.waitFor(() => expect(flushMock).toHaveBeenCalled());

    expect(sigtermHandlers).toHaveLength(1);
    sigtermHandlers[0]?.();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(captureMessageMock).not.toHaveBeenCalled();

    releaseFlush();
    await run;
  });

  it("reports a mid-run SIGTERM and exits 1", async () => {
    let finishMain: () => void = () => undefined;
    const run = runJobEntryPoint(
      "Test job",
      () =>
        new Promise<void>((resolve) => {
          finishMain = resolve;
        }),
    );

    sigtermHandlers[0]?.();
    await vi.waitFor(() => expect(exitSpy).toHaveBeenCalledWith(1));
    expect(captureMessageMock).toHaveBeenCalledWith(
      "Test job received SIGTERM",
      "error",
    );

    finishMain();
    await run;
  });
});
