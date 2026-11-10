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

import { EventEmitter } from "node:events";

import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CLOSE_TIMEOUT_MS,
  registerShutdownHandlers,
  SHUTDOWN_TIMEOUT_MS,
  type ShutdownDeps,
} from "~@idaho-th/server/server/shutdown";

const segmentCloseAndFlushMock = vi.hoisted(() => vi.fn());

vi.mock("~@idaho-th/trpc/routes/common/segment", () => ({
  segment: { closeAndFlush: segmentCloseAndFlushMock },
  SEGMENT_CLOSE_AND_FLUSH_TIMEOUT_MS: 2000,
}));

let server: FastifyInstance;
let signals: EventEmitter;
let exit: ReturnType<typeof vi.fn<(code: number) => void>>;
let flushAnalytics: ReturnType<typeof vi.fn<() => Promise<void>>>;
let flushSentry: ReturnType<
  typeof vi.fn<(timeoutMs: number) => Promise<boolean>>
>;

function register(overrides: Partial<ShutdownDeps> = {}) {
  registerShutdownHandlers(server, {
    signalSource: signals as unknown as Pick<NodeJS.Process, "on">,
    exit,
    flushAnalytics,
    flushSentry,
    ...overrides,
  });
}

beforeEach(() => {
  server = Fastify();
  signals = new EventEmitter();
  exit = vi.fn<(code: number) => void>();
  flushAnalytics = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  flushSentry = vi
    .fn<(timeoutMs: number) => Promise<boolean>>()
    .mockResolvedValue(true);
  segmentCloseAndFlushMock.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("registerShutdownHandlers", () => {
  it.each(["SIGTERM", "SIGINT"])(
    "closes the server, then flushes Segment and Sentry, and exits 0 on %s",
    async (signal) => {
      const onClose = vi.fn();
      server.addHook("onClose", async () => {
        onClose();
      });
      register();

      signals.emit(signal);

      await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));
      expect(onClose).toHaveBeenCalledOnce();
      expect(flushAnalytics).toHaveBeenCalledOnce();
      expect(flushSentry).toHaveBeenCalledOnce();
      const [closedAt] = onClose.mock.invocationCallOrder;
      const [analyticsAt] = flushAnalytics.mock.invocationCallOrder;
      const [sentryAt] = flushSentry.mock.invocationCallOrder;
      expect(analyticsAt).toBeGreaterThan(closedAt ?? Infinity);
      expect(sentryAt).toBeGreaterThan(closedAt ?? Infinity);
    },
  );

  it.each([
    ["Segment", () => flushAnalytics],
    ["Sentry", () => flushSentry],
  ])(
    "still runs the other flush and exits when the %s flush rejects",
    async (_name, failing) => {
      failing().mockRejectedValue(new Error("flush failed"));
      const logError = vi.spyOn(server.log, "error");
      register();

      signals.emit("SIGTERM");

      await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));
      expect(flushAnalytics).toHaveBeenCalledOnce();
      expect(flushSentry).toHaveBeenCalledOnce();
      expect(logError).toHaveBeenCalledWith(
        expect.objectContaining({ signal: "SIGTERM" }),
        "Shutdown flush failed",
      );
    },
  );

  it("still flushes, then exits 1, when an onClose hook throws", async () => {
    server.addHook("onClose", async () => {
      throw new Error("pool teardown failed");
    });
    register();

    signals.emit("SIGTERM");

    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(1));
    expect(exit).toHaveBeenCalledOnce();
    expect(flushAnalytics).toHaveBeenCalledOnce();
    expect(flushSentry).toHaveBeenCalledOnce();
  });

  it("stops waiting for close after its budget, flushes, and exits 1", async () => {
    vi.useFakeTimers();
    server.addHook("onClose", () => new Promise<void>(() => undefined));
    register();

    signals.emit("SIGTERM");
    await vi.advanceTimersByTimeAsync(CLOSE_TIMEOUT_MS - 1);
    expect(flushAnalytics).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(flushAnalytics).toHaveBeenCalledOnce();
    expect(flushSentry).toHaveBeenCalledOnce();
    expect(exit).toHaveBeenCalledOnce();
    expect(exit).toHaveBeenCalledWith(1);
  });

  it("force-exits 1 when the whole shutdown outlasts the timeout", async () => {
    vi.useFakeTimers();
    flushAnalytics.mockReturnValue(new Promise<void>(() => undefined));
    register();

    signals.emit("SIGTERM");
    await vi.advanceTimersByTimeAsync(SHUTDOWN_TIMEOUT_MS - 1);
    expect(exit).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(exit).toHaveBeenCalledOnce();
    expect(exit).toHaveBeenCalledWith(1);
  });

  it("ignores repeat signals while a shutdown is in progress", async () => {
    let finishClose: () => void = () => undefined;
    const onClose = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishClose = resolve;
        }),
    );
    server.addHook("onClose", onClose);
    register();

    signals.emit("SIGTERM");
    signals.emit("SIGTERM");
    signals.emit("SIGINT");
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
    finishClose();

    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));
    expect(onClose).toHaveBeenCalledOnce();
    expect(flushAnalytics).toHaveBeenCalledOnce();
    expect(exit).toHaveBeenCalledOnce();
  });

  it("flushes Segment while a request is still in flight", async () => {
    let releaseRequest: () => void = () => undefined;
    let markRequestStarted: () => void = () => undefined;
    const requestStarted = new Promise<void>((resolve) => {
      markRequestStarted = resolve;
    });
    server.get("/slow", async () => {
      markRequestStarted();
      await new Promise<void>((resolve) => {
        releaseRequest = resolve;
      });
      return { ok: true };
    });
    const address = await server.listen({ port: 0, host: "127.0.0.1" });
    register({ closeTimeoutMs: 50 });

    const response = fetch(`${address}/slow`);
    await requestStarted;
    signals.emit("SIGTERM");

    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(1));
    expect(flushAnalytics).toHaveBeenCalledOnce();
    expect(flushSentry).toHaveBeenCalledOnce();

    releaseRequest();
    await response;
  });

  it("flushes the shared Segment client by default", async () => {
    register({ flushAnalytics: undefined });

    signals.emit("SIGTERM");

    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));
    expect(segmentCloseAndFlushMock).toHaveBeenCalledOnce();
  });
});
