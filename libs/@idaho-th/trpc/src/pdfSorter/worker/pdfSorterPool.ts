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

import { execFile } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import Piscina from "piscina";

import {
  MAX_PDF_SORTER_POOL_THREADS,
  PDF_SORTER_IDLE_TIMEOUT_MS,
  PDF_SORTER_JOB_TIMEOUT_MS,
  PDF_SORTER_MEMORY_BUDGET_MB,
  PDF_SORTER_QUEUE_MAX,
  PDF_SORTER_QUEUE_WAIT_TIMEOUT_MS,
} from "~@idaho-th/trpc/pdfSorter/constants";
import { PdfProcessingError } from "~@idaho-th/trpc/pdfSorter/errors";
import type {
  PreparedPdfForExtraction,
  PreparePdfForExtractionOptions,
} from "~@idaho-th/trpc/pdfSorter/prepare/preparePdfForExtraction";
import type { PdfSorterWorkerInput } from "~@idaho-th/trpc/pdfSorter/worker/pdfSorterWorker";
import { serverConfig } from "~@idaho-th/trpc/routes/common/serverConfig";

// In production this module is bundled directly into main.js (it is not its
// own esbuild entry point), so import.meta.url here resolves to main.js's own
// location. The worker is compiled separately via the app's
// `workers/pdfSorterWorker.entry.ts` (an esbuild `additionalEntryPoints`
// target — see apps/@idaho-th/server/project.json), which lands as a sibling
// `workers/pdfSorterWorker.entry.js` next to main.js.
//
// In dev/test this module runs from its real source location via vite-node.
// Piscina always loads its worker file via a native dynamic `import()`
// (see piscina/src/worker.ts), so pointing it at raw TypeScript source and
// relying on a loader (tsx, ts-node, etc.) to transform nested relative
// imports on demand does not work reliably: ESM loader hooks stop working
// inside worker threads on Node >=22.2
// (https://github.com/nodejs/node/issues/53097), which breaks resolution of
// this subtree's extensionless relative imports there, even though the same
// code runs fine on Node 24. Since production already solves this by handing
// Piscina a single pre-bundled, dependency-free JS file, we do the same thing
// for dev/test: bundle pdfSorterWorker.ts with esbuild into a temp file once
// (matching the app's production esbuild config) and point Piscina at that
// instead of the TS source, so no runtime module resolution — and therefore
// no dependency on loader hooks — happens inside the worker thread at all.
// The bundling itself shells out to esbuild's CLI binary rather than calling
// its JS API in-process: under Vitest's jsdom test environment, esbuild's own
// UTF-8 encoding sanity check fails against jsdom's patched TextEncoder, so
// the bundle step needs a real, unpatched Node process.
//
// Resolution is deliberately deferred to first use (not module load time):
// under Vitest, import.meta.url of this module isn't a real file:// URL, and
// merely importing this module (transitively, from anywhere) must not throw.
function currentDir(): string {
  const rawUrl = import.meta.url;
  const currentFile = rawUrl.startsWith("file://")
    ? fileURLToPath(rawUrl)
    : rawUrl;
  return dirname(currentFile);
}

const execFileAsync = promisify(execFile);

async function bundleDevWorker(): Promise<string> {
  const require = createRequire(join(currentDir(), "index.js"));
  const esbuildBin = require.resolve("esbuild/bin/esbuild");
  // mupdf is left external (see below) and resolved from node_modules at
  // runtime, so the bundle must live somewhere Node's bare-specifier
  // resolution can walk up from and still find it — unlike the OS temp
  // directory, which sits outside any node_modules ancestry entirely.
  // esbuildBin is ".../node_modules/esbuild/bin/esbuild", so two levels up
  // is node_modules itself.
  const nodeModulesDir = dirname(dirname(esbuildBin));
  const cacheDir = join(nodeModulesDir, ".cache", "idaho-th-pdf-sorter-worker");
  await mkdir(cacheDir, { recursive: true });
  const outDir = await mkdtemp(join(cacheDir, "run-"));
  const outfile = join(outDir, "pdfSorterWorker.bundle.mjs");
  await execFileAsync(esbuildBin, [
    resolve(currentDir(), "./pdfSorterWorker.ts"),
    `--outfile=${outfile}`,
    "--bundle",
    "--platform=node",
    "--format=esm",
    "--target=node22",
    // mupdf ships a WASM binary that its JS glue locates relative to its own
    // package directory at runtime. Bundling it would sever that relative
    // path, so it's left external and resolved from node_modules as normal.
    "--external:mupdf",
  ]);
  return outfile;
}

let pool: Piscina | undefined;
let poolPromise: Promise<Piscina> | undefined;

function getPool(): Promise<Piscina> {
  if (pool) return Promise.resolve(pool);
  poolPromise ??= (async () => {
    const filename = serverConfig.isProduction
      ? resolve(currentDir(), "./workers/pdfSorterWorker.entry.js")
      : await bundleDevWorker();
    pool = new Piscina({
      filename,
      maxThreads: MAX_PDF_SORTER_POOL_THREADS,
      // Backpressure: reject new work past this many queued tasks instead of
      // growing the queue unboundedly under sustained load.
      maxQueue: PDF_SORTER_QUEUE_MAX,
      // Release idle worker threads' memory back to the container between
      // bursts instead of holding it indefinitely.
      idleTimeout: PDF_SORTER_IDLE_TIMEOUT_MS,
      // Bounds each worker's V8 heap so a mupdf WASM leak (or any other
      // per-worker growth) hits a fatal, recoverable worker-thread error —
      // which Piscina responds to by respawning the worker — instead of
      // slowly consuming the container's memory budget.
      resourceLimits: {
        maxOldGenerationSizeMb: Math.max(
          256,
          Math.floor(PDF_SORTER_MEMORY_BUDGET_MB / MAX_PDF_SORTER_POOL_THREADS),
        ),
      },
    });
    return pool;
  })();
  return poolPromise;
}

/**
 * In-process slot gate sized to the pool's thread count, sitting in front of
 * Piscina's own queue. Tasks wait here (bounded by
 * PDF_SORTER_QUEUE_WAIT_TIMEOUT_MS and PDF_SORTER_QUEUE_MAX) rather than in
 * Piscina's queue, so by the time a task is actually submitted a worker is
 * free to run it immediately. That's what lets the per-job execution timeout
 * below start at execution rather than at submission — otherwise queue wait
 * under load would silently eat a queued task's entire execution budget
 * before it ever ran (at MAX_PDF_SORTER_POOL_THREADS = 1 in prod, a task
 * queued behind one 25s job would get only 5s of its 30s budget).
 */
let activeSlots = 0;
const slotWaiters: Array<() => void> = [];

/** Surfaces a signal's abort reason as an Error the caller can rethrow. */
function abortReasonAsError(reason: unknown): Error {
  return reason instanceof Error
    ? reason
    : new Error("PDF processing task was aborted");
}

function acquireSlot(signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(abortReasonAsError(signal.reason));
  }
  if (activeSlots < MAX_PDF_SORTER_POOL_THREADS) {
    activeSlots += 1;
    return Promise.resolve();
  }
  if (slotWaiters.length >= PDF_SORTER_QUEUE_MAX) {
    return Promise.reject(
      new PdfProcessingError(
        "PDF processing queue is full; server is busy — try again shortly",
      ),
    );
  }
  return new Promise<void>((resolvePromise, rejectPromise) => {
    // Mutable holder so `cleanup` can reference this waiter's own grant
    // function and timer without a `let`-then-assign-once pattern (which
    // would trip prefer-const) or a forward reference (no-use-before-define).
    const waiter: {
      grant?: () => void;
      onAbort?: () => void;
      waitTimer?: ReturnType<typeof setTimeout>;
    } = {};
    const cleanup = () => {
      if (waiter.grant) {
        const index = slotWaiters.indexOf(waiter.grant);
        if (index !== -1) slotWaiters.splice(index, 1);
      }
      clearTimeout(waiter.waitTimer);
      if (waiter.onAbort) signal?.removeEventListener("abort", waiter.onAbort);
    };
    // Invoked by releaseSlot with the slot already re-counted for this waiter.
    waiter.grant = () => {
      cleanup();
      resolvePromise();
    };
    waiter.waitTimer = setTimeout(() => {
      cleanup();
      rejectPromise(
        new PdfProcessingError(
          `Timed out waiting ${String(PDF_SORTER_QUEUE_WAIT_TIMEOUT_MS)}ms for a free PDF processing slot; server is busy — try again shortly`,
        ),
      );
    }, PDF_SORTER_QUEUE_WAIT_TIMEOUT_MS);
    if (signal) {
      waiter.onAbort = () => {
        cleanup();
        rejectPromise(abortReasonAsError(signal.reason));
      };
      signal.addEventListener("abort", waiter.onAbort);
    }
    slotWaiters.push(waiter.grant);
  });
}

function releaseSlot(): void {
  const next = slotWaiters.shift();
  if (next) {
    // Hand the slot straight to the next waiter; activeSlots stays counted.
    next();
  } else {
    activeSlots -= 1;
  }
}

/**
 * Per-job execution timeout, started only once a slot has been acquired (so
 * it measures execution, not queue wait — see acquireSlot above). Aborts
 * with a descriptive PdfProcessingError rather than AbortSignal.timeout's
 * opaque DOMException, so callers unwrapping Piscina's AbortError `cause`
 * always surface a readable message. The budget exists because a wedged
 * mupdf/tesseract call inside a worker can't be interrupted from within —
 * without it a hung task would hold a worker thread (and, at
 * MAX_PDF_SORTER_POOL_THREADS = 1 in prod, the entire pool) hostage
 * indefinitely.
 */
function createJobTimeout(): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(
      new PdfProcessingError(
        `PDF processing timed out after ${String(PDF_SORTER_JOB_TIMEOUT_MS)}ms`,
      ),
    );
  }, PDF_SORTER_JOB_TIMEOUT_MS);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

/**
 * Piscina rejects with a plain `Error("Task queue is at limit")` when
 * `maxQueue` is exceeded (see node_modules/piscina/dist/errors.js). Rethrown
 * as a PdfProcessingError with a caller-facing message, matching the
 * reference implementation's "server busy" behavior.
 */
function isQueueFullError(error: unknown): boolean {
  return error instanceof Error && error.message === "Task queue is at limit";
}

/**
 * Runs one Piscina task with the shared timeout/backpressure policy: tasks
 * first wait for a free worker slot (bounded queue depth and wait time —
 * see acquireSlot), then get a per-job execution timeout that starts only
 * once they actually run. A queue-full rejection — whether from the slot
 * gate or from Piscina's own maxQueue backstop — is normalized to a
 * caller-facing PdfProcessingError rather than Piscina's internal error
 * text.
 */
async function runOnPool<T>(
  input: PdfSorterWorkerInput,
  signal?: AbortSignal,
): Promise<T> {
  const activePool = await getPool();
  await acquireSlot(signal);
  const jobTimeout = createJobTimeout();
  // Passing signal lets Piscina actually terminate the worker thread running
  // this task on abort (see Piscina's runTask: "Already running: We cancel
  // the Worker this is running on"), unlike a bare Promise.race timeout
  // (see utils/withTimeout.ts), which only stops the caller from waiting
  // while the worker keeps burning CPU/OCR calls to completion.
  try {
    return await activePool.run(input, {
      signal: signal
        ? AbortSignal.any([signal, jobTimeout.signal])
        : jobTimeout.signal,
    });
  } catch (error) {
    if (isQueueFullError(error)) {
      throw new PdfProcessingError(
        "PDF processing queue is full; server is busy — try again shortly",
        { cause: error },
      );
    }
    throw error;
  } finally {
    jobTimeout.clear();
    releaseSlot();
  }
}

export function runPdfSorterWorker(
  pdfBase64: string,
  options?: PreparePdfForExtractionOptions,
  signal?: AbortSignal,
): Promise<PreparedPdfForExtraction> {
  return runOnPool({ task: "prepare", pdfBase64, options }, signal);
}

/**
 * Runs the second-pass downsample/recompress step (see
 * `PreparePdfForExtractionOptions.skipCompression`) as its own worker-thread
 * task on the same pool, so it can run concurrently with whatever the
 * caller already handed the uncompressed pages off to (e.g. a Vertex call).
 */
export function runPdfCompressorWorker(
  combinedBase64: string,
  signal?: AbortSignal,
): Promise<string> {
  return runOnPool({ task: "compress", combinedBase64 }, signal);
}

/**
 * Starts building the worker pool immediately rather than lazily on the
 * first real request. In dev/test, `getPool()` shells out to esbuild to
 * bundle the worker file the first time it's called (see `bundleDevWorker`
 * above) — without this, that one-time bundling cost lands on whichever
 * user's upload happens to be first after a server restart. Call this from
 * the server's startup path; failures are logged, not thrown, since a
 * failed warmup just means the same bundling work happens lazily later.
 */
export function warmPdfSorterPool(log: {
  error: (message: string, metadata?: Record<string, unknown>) => void;
}): void {
  getPool().catch((error: unknown) => {
    log.error("Failed to warm PDF sorter worker pool", {
      errorName: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  });
}

/**
 * Tears down the worker pool's threads. Call this from the server's shutdown
 * path (e.g. a Fastify `onClose` hook) so in-flight worker threads don't keep
 * the process alive after `fastify.close()`.
 */
export async function destroyPdfSorterPool(): Promise<void> {
  const current = pool ?? (await poolPromise);
  pool = undefined;
  poolPromise = undefined;
  await current?.destroy();
}
