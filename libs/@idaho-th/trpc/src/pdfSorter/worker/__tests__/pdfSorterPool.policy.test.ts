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

// This suite imports its subject dynamically (after the mocks above), so it has
// no static import to mark it as a module — without this the top-level consts
// would land in the shared global scope of the spec typecheck.
export {};

type AbortSignalWithAny = typeof AbortSignal & {
  any?: (signals: AbortSignal[]) => AbortSignal;
};

// The pool combines the caller's signal with its own job timeout via
// AbortSignal.any. Node has it; the jsdom test environment's AbortSignal does
// not, which is what kept this path untestable. Shim it for the suite only.
if (typeof (AbortSignal as AbortSignalWithAny).any !== "function") {
  (AbortSignal as AbortSignalWithAny).any = (signals: AbortSignal[]) => {
    const controller = new AbortController();
    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort(signal.reason);
        break;
      }
      signal.addEventListener("abort", () => controller.abort(signal.reason), {
        once: true,
      });
    }
    return controller.signal;
  };
}

/**
 * A PdfProcessingError-shaped reason, built without importing the class:
 * vi.resetModules gives each test a fresh copy of the errors module too, so
 * `instanceof` across that boundary is meaningless and the assertions below
 * check `name` instead.
 */
function pdfProcessingReason(message: string): Error {
  const error = new Error(message);
  error.name = "PdfProcessingError";
  return error;
}

/**
 * The pool's policy — slot gating, queue backpressure and the per-job
 * execution timeout — is what keeps one wedged mupdf/tesseract call from
 * holding the whole pool hostage. Piscina itself is stubbed so none of that
 * needs real worker threads (or the dev-time esbuild bundle step).
 */
type PoolCall = {
  input: unknown;
  signal: AbortSignal;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
};

const poolFake = vi.hoisted(() => ({
  calls: [] as PoolCall[],
  destroyed: 0,
  /** Set to fail construction, exercising the warmup's error path. */
  constructError: undefined as Error | undefined,
}));

// Plain class, not vi.fn: the config-level mockReset would empty a mocked
// constructor's implementation between tests.
vi.mock("piscina", () => ({
  default: class {
    constructor() {
      if (poolFake.constructError) throw poolFake.constructError;
    }
    async run(input: unknown, opts: { signal: AbortSignal }) {
      return new Promise((resolve, reject) => {
        poolFake.calls.push({ input, signal: opts.signal, resolve, reject });
        opts.signal.addEventListener("abort", () => {
          reject(opts.signal.reason);
        });
      });
    }
    async destroy() {
      poolFake.destroyed += 1;
    }
  },
}));

// isProduction short-circuits the dev-only esbuild bundling of the worker file;
// the stubbed Piscina never loads it, so the path only has to be computed.
vi.mock("~@idaho-th/trpc/routes/common/serverConfig", () => ({
  serverConfig: { isProduction: true, isDevelopment: false, nodeEnv: "test" },
}));

// Small, explicit limits so backpressure and the timeout paths are reachable
// in milliseconds. The queue wait must stay well under the job timeout, or a
// blocking task's own timeout frees the slot before a waiter can time out.
vi.mock("~@idaho-th/trpc/pdfSorter/constants", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("~@idaho-th/trpc/pdfSorter/constants")
  >()),
  MAX_PDF_SORTER_POOL_THREADS: 1,
  PDF_SORTER_QUEUE_MAX: 2,
  PDF_SORTER_QUEUE_WAIT_TIMEOUT_MS: 60,
  PDF_SORTER_JOB_TIMEOUT_MS: 1_500,
}));

type PoolModule =
  typeof import("~@idaho-th/trpc/pdfSorter/worker/pdfSorterPool");

/**
 * The slot counter and wait queue are module state with no reset hook, so each
 * test gets its own copy of the module rather than inheriting whatever the
 * previous test left in flight.
 */
let destroyPdfSorterPool: PoolModule["destroyPdfSorterPool"];
let runPdfCompressorWorker: PoolModule["runPdfCompressorWorker"];
let runPdfSorterWorker: PoolModule["runPdfSorterWorker"];
let warmPdfSorterPool: PoolModule["warmPdfSorterPool"];

const PDF_BASE64 = Buffer.from("%PDF-1.7 fake").toString("base64");
const COMBINED_BASE64 = Buffer.from("%PDF-1.7 combined").toString("base64");
const PREPARED = {
  perPageBase64: [],
  combinedBase64: COMBINED_BASE64,
  missingPageNumbers: [],
};

/** Waits until the stubbed pool has been handed `count` tasks. */
async function waitForCalls(count: number) {
  await vi.waitFor(
    () => {
      expect(poolFake.calls).toHaveLength(count);
    },
    { timeout: 5_000 },
  );
}

/** The task at `index`, failing loudly instead of reading through undefined. */
function callAt(index: number): PoolCall {
  const call = poolFake.calls[index];
  if (!call) {
    throw new Error(`the stubbed pool was handed no task at index ${index}`);
  }
  return call;
}

beforeEach(async () => {
  poolFake.calls.length = 0;
  poolFake.destroyed = 0;
  poolFake.constructError = undefined;

  vi.resetModules();
  ({
    destroyPdfSorterPool,
    runPdfCompressorWorker,
    runPdfSorterWorker,
    warmPdfSorterPool,
  } = await import("~@idaho-th/trpc/pdfSorter/worker/pdfSorterPool"));
});

afterEach(async () => {
  // Settle anything still in flight so no task keeps running past its test.
  // destroy rethrows a failed construction, a test-setup concern here.
  for (const call of poolFake.calls) call.resolve(PREPARED);
  await destroyPdfSorterPool().catch(() => undefined);
});

describe("runPdfSorterWorker", () => {
  it("submits a prepare task and returns its result", async () => {
    const promise = runPdfSorterWorker(PDF_BASE64, { totalPages: 4 });
    await waitForCalls(1);

    callAt(0).resolve(PREPARED);

    await expect(promise).resolves.toEqual(PREPARED);
    expect(callAt(0).input).toEqual({
      task: "prepare",
      pdfBase64: PDF_BASE64,
      options: { totalPages: 4 },
    });
  });

  it("hands Piscina a real signal so the worker thread can be terminated", async () => {
    const promise = runPdfSorterWorker(PDF_BASE64);
    await waitForCalls(1);

    // A bare Promise.race timeout would leave the worker burning OCR calls.
    expect(callAt(0).signal).toBeInstanceOf(AbortSignal);
    callAt(0).resolve(PREPARED);
    await promise;
  });

  it("propagates a worker failure to the caller", async () => {
    const failure = new Error("mupdf blew up inside the worker");
    const promise = runPdfSorterWorker(PDF_BASE64);
    await waitForCalls(1);

    callAt(0).reject(failure);

    await expect(promise).rejects.toBe(failure);
  });

  it("frees the slot after a failure so the next task still runs", async () => {
    const first = runPdfSorterWorker(PDF_BASE64);
    await waitForCalls(1);
    callAt(0).reject(new Error("boom"));
    await expect(first).rejects.toThrow("boom");

    const second = runPdfSorterWorker(PDF_BASE64);
    await waitForCalls(2);
    callAt(1).resolve(PREPARED);

    await expect(second).resolves.toEqual(PREPARED);
  });

  it("normalizes Piscina's own queue-limit rejection", async () => {
    const promise = runPdfSorterWorker(PDF_BASE64);
    await waitForCalls(1);

    callAt(0).reject(new Error("Task queue is at limit"));

    await expect(promise).rejects.toMatchObject({
      name: "PdfProcessingError",
      message: expect.stringContaining("PDF processing queue is full"),
    });
  });
});

describe("runPdfCompressorWorker", () => {
  it("submits a compress task on the same pool", async () => {
    const promise = runPdfCompressorWorker(COMBINED_BASE64);
    await waitForCalls(1);

    callAt(0).resolve(COMBINED_BASE64);

    await expect(promise).resolves.toBe(COMBINED_BASE64);
    expect(callAt(0).input).toEqual({
      task: "compress",
      combinedBase64: COMBINED_BASE64,
    });
  });
});

describe("caller cancellation", () => {
  it("rejects immediately when the caller's signal is already aborted", async () => {
    const controller = new AbortController();
    const reason = pdfProcessingReason("ordering timed out");
    controller.abort(reason);

    await expect(
      runPdfSorterWorker(PDF_BASE64, undefined, controller.signal),
    ).rejects.toBe(reason);
    // Nothing was submitted, so no worker slot was consumed.
    expect(poolFake.calls).toHaveLength(0);
  });

  it("surfaces a generic error for a non-Error abort reason", async () => {
    const controller = new AbortController();
    controller.abort("cancelled by the client");

    await expect(
      runPdfSorterWorker(PDF_BASE64, undefined, controller.signal),
    ).rejects.toThrow("PDF processing task was aborted");
  });

  it("aborts an in-flight task when the caller cancels", async () => {
    const controller = new AbortController();
    const reason = pdfProcessingReason("caller gave up");
    const promise = runPdfSorterWorker(
      PDF_BASE64,
      undefined,
      controller.signal,
    );
    await waitForCalls(1);

    controller.abort(reason);

    await expect(promise).rejects.toBe(reason);
  });

  it("drops a queued task when its caller cancels while it waits", async () => {
    const blocking = runPdfSorterWorker(PDF_BASE64);
    await waitForCalls(1);

    const controller = new AbortController();
    const queued = runPdfSorterWorker(PDF_BASE64, undefined, controller.signal);
    controller.abort(pdfProcessingReason("caller gave up while queued"));

    await expect(queued).rejects.toThrow("caller gave up while queued");

    // The waiter was removed, so the blocking task's slot goes to nobody else.
    callAt(0).resolve(PREPARED);
    await expect(blocking).resolves.toEqual(PREPARED);
  });
});

describe("backpressure", () => {
  it("runs one task at a time and hands the slot on in order", async () => {
    const first = runPdfSorterWorker(PDF_BASE64);
    await waitForCalls(1);

    const second = runPdfSorterWorker(PDF_BASE64);
    // Still only one task submitted: the second is waiting for a slot.
    expect(poolFake.calls).toHaveLength(1);

    callAt(0).resolve(PREPARED);
    await expect(first).resolves.toEqual(PREPARED);

    await waitForCalls(2);
    callAt(1).resolve(PREPARED);
    await expect(second).resolves.toEqual(PREPARED);
  });

  it("rejects new work once the wait queue is full", async () => {
    const blocking = runPdfSorterWorker(PDF_BASE64);
    await waitForCalls(1);

    // Two waiters fill the queue; the third arrival is refused outright rather
    // than growing the queue unboundedly.
    const queued = [
      runPdfSorterWorker(PDF_BASE64),
      runPdfSorterWorker(PDF_BASE64),
    ];

    await expect(runPdfSorterWorker(PDF_BASE64)).rejects.toThrow(
      "PDF processing queue is full",
    );

    // The two waiters themselves are not the subject here; let them settle
    // however they like so the test does not depend on their timing.
    callAt(0).resolve(PREPARED);
    await blocking;
    for (const call of poolFake.calls) call.resolve(PREPARED);
    await Promise.allSettled(queued);
  });

  it("gives up on a task that waits too long for a slot", async () => {
    const blocking = runPdfSorterWorker(PDF_BASE64);
    await waitForCalls(1);

    await expect(runPdfSorterWorker(PDF_BASE64)).rejects.toThrow(
      "Timed out waiting 60ms for a free PDF processing slot",
    );

    callAt(0).resolve(PREPARED);
    await expect(blocking).resolves.toEqual(PREPARED);
  });
});

describe("pool lifecycle", () => {
  it("builds the pool once across several tasks and tears it down once", async () => {
    const first = runPdfSorterWorker(PDF_BASE64);
    await waitForCalls(1);
    callAt(0).resolve(PREPARED);
    await first;

    const second = runPdfSorterWorker(PDF_BASE64);
    await waitForCalls(2);
    callAt(1).resolve(PREPARED);
    await second;

    await destroyPdfSorterPool();
    expect(poolFake.destroyed).toBe(1);
  });

  it("tears down without a pool having been built", async () => {
    await expect(destroyPdfSorterPool()).resolves.toBeUndefined();
    expect(poolFake.destroyed).toBe(0);
  });

  it("warms the pool without logging when construction succeeds", async () => {
    const log = { error: vi.fn() };

    warmPdfSorterPool(log);
    await destroyPdfSorterPool();

    expect(log.error).not.toHaveBeenCalled();
    expect(poolFake.destroyed).toBe(1);
  });
});

describe("execution budget and warmup", () => {
  it("aborts a task that outruns its execution budget", async () => {
    const promise = runPdfSorterWorker(PDF_BASE64);
    await waitForCalls(1);

    // A wedged worker cannot be interrupted from within, so the pool aborts it.
    await expect(promise).rejects.toMatchObject({
      name: "PdfProcessingError",
      message: expect.stringContaining("PDF processing timed out after 1500ms"),
    });
  }, 10_000);

  it("logs rather than throws when the warmup fails", async () => {
    poolFake.constructError = new Error("esbuild is missing");
    const log = { error: vi.fn() };

    // A failed warmup must not take the server down; the work happens lazily.
    expect(() => warmPdfSorterPool(log)).not.toThrow();

    await vi.waitFor(() => {
      expect(log.error).toHaveBeenCalledWith(
        "Failed to warm PDF sorter worker pool",
        { errorName: "Error", errorMessage: "esbuild is missing" },
      );
    });
  });
});
