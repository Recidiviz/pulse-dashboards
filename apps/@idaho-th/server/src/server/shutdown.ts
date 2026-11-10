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

import { flush } from "@sentry/node";
import type { FastifyInstance } from "fastify";

import {
  segment,
  SEGMENT_CLOSE_AND_FLUSH_TIMEOUT_MS,
} from "~@idaho-th/trpc/routes/common/segment";

// Cloud Run sends SIGKILL 10s after SIGTERM
// (https://cloud.google.com/run/docs/container-contract#instance-shutdown);
// this leaves headroom for the exit itself.
export const SHUTDOWN_TIMEOUT_MS = 8000;
const SENTRY_FLUSH_TIMEOUT_MS = 1000;
const SHUTDOWN_STEP_SLACK_MS = 500;
// close() waits for in-flight requests, and an upload or Vertex extraction can
// outlast the whole window, so close only gets what the flushes after it leave.
export const CLOSE_TIMEOUT_MS =
  SHUTDOWN_TIMEOUT_MS -
  Math.max(SEGMENT_CLOSE_AND_FLUSH_TIMEOUT_MS, SENTRY_FLUSH_TIMEOUT_MS) -
  SHUTDOWN_STEP_SLACK_MS;

const SHUTDOWN_SIGNALS = ["SIGTERM", "SIGINT"] as const;

type ShutdownSignal = (typeof SHUTDOWN_SIGNALS)[number];

type CloseOutcome = "closed" | "failed" | "timed_out";

export type ShutdownDeps = {
  signalSource?: Pick<NodeJS.Process, "on">;
  exit?: (code: number) => void;
  flushAnalytics?: () => Promise<void>;
  flushSentry?: (timeoutMs: number) => Promise<boolean>;
  timeoutMs?: number;
  closeTimeoutMs?: number;
};

async function closeWithin(
  server: FastifyInstance,
  timeoutMs: number,
): Promise<CloseOutcome> {
  let timer: NodeJS.Timeout | undefined;
  const timedOut = new Promise<CloseOutcome>((resolve) => {
    timer = setTimeout(() => resolve("timed_out"), timeoutMs);
  });
  const closed = server.close().then(
    (): CloseOutcome => "closed",
    (err: unknown): CloseOutcome => {
      server.log.error({ err }, "Server close failed");
      return "failed";
    },
  );

  try {
    return await Promise.race([closed, timedOut]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Segment is flushed here as well as in onClose because onClose only runs
 * after every in-flight request ends, which may be after SIGKILL.
 */
export function registerShutdownHandlers(
  server: FastifyInstance,
  deps: ShutdownDeps = {},
): void {
  const signalSource = deps.signalSource ?? process;
  const exit = deps.exit ?? ((code: number) => process.exit(code));
  const flushAnalytics = deps.flushAnalytics ?? (() => segment.closeAndFlush());
  const flushSentry = deps.flushSentry ?? flush;
  const timeoutMs = deps.timeoutMs ?? SHUTDOWN_TIMEOUT_MS;
  const closeTimeoutMs = deps.closeTimeoutMs ?? CLOSE_TIMEOUT_MS;

  let shuttingDown = false;

  const shutdown = async (signal: ShutdownSignal) => {
    // A listener stays attached for repeat signals: without one, Node's default
    // handler would kill the process mid-close and drop the flush.
    if (shuttingDown) return;
    shuttingDown = true;

    server.log.info({ signal }, "Shutting down server");

    const forceExit = setTimeout(() => {
      server.log.error({ signal, timeoutMs }, "Server shutdown timed out");
      exit(1);
    }, timeoutMs);
    forceExit.unref();

    const outcome = await closeWithin(server, closeTimeoutMs);
    if (outcome === "timed_out") {
      server.log.warn(
        { signal, closeTimeoutMs },
        "Server close timed out with requests still in flight",
      );
    }

    // After a clean close onClose has already flushed Segment, so that flush
    // resolves immediately.
    const flushes = await Promise.allSettled([
      Promise.resolve().then(flushAnalytics),
      Promise.resolve().then(() => flushSentry(SENTRY_FLUSH_TIMEOUT_MS)),
    ]);
    for (const result of flushes) {
      if (result.status === "rejected") {
        server.log.error(
          { signal, err: result.reason },
          "Shutdown flush failed",
        );
      }
    }
    clearTimeout(forceExit);
    exit(outcome === "closed" ? 0 : 1);
  };

  for (const signal of SHUTDOWN_SIGNALS) {
    signalSource.on(signal, () => void shutdown(signal));
  }
}
