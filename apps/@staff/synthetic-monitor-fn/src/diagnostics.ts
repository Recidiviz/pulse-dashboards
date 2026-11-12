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

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import type { BrowserContext, Page, Request } from "playwright-core";

import { isTrace, isVerbose } from "./log";

// Live-streams every browser console message (log/info/warn/error/debug) to our
// stdout as it happens, so a flaky run's in-page output is visible inline rather
// than only the error-typed subset buffered for the failure dump. VERBOSE-gated
// because this is noisy by design — it's the per-state trace you turn on when
// hunting a flake. The smoke runner sets VERBOSE for local sweeps.
export function streamBrowserConsole(page: Page): void {
  if (!isVerbose()) return;
  page.on("console", (message) => {
    console.info(`[browser:${message.type()}] ${message.text()}`);
  });
}

// CDN/edge response headers worth capturing on a failed response. The staff app
// is a static SPA on Firebase Hosting fronted by the Fastly CDN, so a 5xx (most
// often a 502 Bad Gateway) is emitted by a Fastly edge when it can't fetch the
// object from the Firebase origin — NOT by any app backend. These headers name
// the exact edge node + cache state + request id, which is what's needed to chase
// a transient CDN↔origin 502 with Firebase/Fastly (and to see whether it was a
// cache MISS, which is the 502-prone path for the large hashed bundles).
const EDGE_DIAGNOSTIC_HEADERS = [
  "server",
  "via",
  "x-served-by",
  "x-cache",
  "x-cache-hits",
  "x-timer",
  // Present only when we send `Fastly-Debug: 1` (see index.ts): the fetch/delivery
  // edge nodes and the TTL/cache state (M=miss, H=hit) for this object. Names the
  // exact node + whether it was a cold fill on a 5xx.
  "fastly-debug-path",
  "fastly-debug-ttl",
  "age",
  "retry-after",
  "x-request-id",
  "x-fastly-request-id",
  "fastly-restarts",
  "cf-ray",
] as const;

// Compact "k=v" of just the edge headers that are present, for a one-line dump.
function edgeHeaderSummary(headers: Record<string, string>): string {
  const parts: string[] = [];
  for (const key of EDGE_DIAGNOSTIC_HEADERS) {
    const value = headers[key];
    if (value !== undefined) parts.push(`${key}=${value}`);
  }
  return parts.join(" ");
}

// Records failed network activity so a failure can name the offending
// request — a backend 5xx, a rate-limit 429, a CORS-blocked or dropped XHR —
// instead of the generic, URL-less "net::ERR_FAILED" console noise. For HTTP failures
// we also capture the CDN/edge headers (EDGE_DIAGNOSTIC_HEADERS) so a Fastly/Firebase
// 502 reports which edge served it and whether it was a cache miss.
// Returns a getter for the accumulated messages.
export function collectNetworkFailures(page: Page): () => string[] {
  const failures: string[] = [];
  page.on("requestfailed", (request) => {
    const reason = request.failure()?.errorText ?? "(unknown)";
    failures.push(
      `requestfailed: ${request.method()} ${request.url()} — ${reason}`,
    );
  });
  page.on("response", (response) => {
    const status = response.status();
    if (status >= 400) {
      // response.headers() is synchronous (already-received response headers).
      const edge = edgeHeaderSummary(response.headers());
      const resourceType = response.request().resourceType();
      failures.push(
        `http ${status}: ${response.request().method()} ${response.url()}` +
          ` [${resourceType}]${edge ? ` — ${edge}` : ""}`,
      );
    }
  });
  return () => failures;
}

// Collects the page's uncaught exceptions and console.error output so a failure
// can report the actual JS error (e.g. what tripped the app's error boundary),
// not just the symptom. Returns a getter for the accumulated messages.
export function collectPageErrors(page: Page): () => string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`console.error: ${message.text()}`);
    }
  });
  return () => errors;
}

// Tracks in-flight requests so a failure can name what the page was STILL waiting
// on when it timed out — the gap collectNetworkFailures can't fill, since a
// slow-but-pending (or slow-but-eventually-200) request never fires requestfailed
// or a >=400 response. This is what distinguishes "app booted but stuck on a data
// XHR" from "app never rendered". Returns a getter for the still-pending requests,
// longest-waiting first, with how long each has been open.
export function collectPendingRequests(page: Page): () => string[] {
  // Playwright Request objects have stable identity across events, so they work
  // as Map keys. Value is the request's start time (ms).
  const inflight = new Map<Request, number>();
  page.on("request", (request) => {
    inflight.set(request, Date.now());
  });
  const settle = (request: Request): void => {
    inflight.delete(request);
  };
  page.on("requestfinished", settle);
  page.on("requestfailed", settle);
  return () => {
    const now = Date.now();
    return [...inflight.entries()]
      .sort((a, b) => a[1] - b[1]) // oldest (longest-pending) first
      .map(
        ([request, startedAt]) =>
          `pending ${((now - startedAt) / 1000).toFixed(1)}s: ` +
          `${request.method()} ${request.url()} [${request.resourceType()}]`,
      );
  };
}

// Fetches an OAuth access token for the runtime service account from the GCP
// metadata server (present in Cloud Run / Functions gen2).
async function fetchMetadataAccessToken(): Promise<string> {
  const response = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    {
      headers: { "Metadata-Flavor": "Google" },
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (!response.ok) {
    throw new Error(`metadata token request failed: ${response.status}`);
  }
  const payload: unknown = await response.json();
  const token = (payload as { access_token?: unknown }).access_token;
  if (typeof token !== "string") {
    throw new Error("metadata token response missing access_token");
  }
  return token;
}

// Uploads bytes to gs://<bucket>/<objectName> via the GCS JSON API using the
// runtime SA's metadata-server token. Deliberately dependency-free: pulling in
// @google-cloud/storage would bloat this cold-start- and memory-sensitive
// function for one upload-on-failure. The function SA holds
// roles/storage.objectCreator on the bucket (granted in screenshots.tf).
async function uploadToGcs(
  bucket: string,
  objectName: string,
  body: Buffer,
  contentType = "image/png",
): Promise<void> {
  const token = await fetchMetadataAccessToken();
  const url =
    `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket)}/o` +
    `?uploadType=media&name=${encodeURIComponent(objectName)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": contentType },
    body,
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`GCS upload failed: ${response.status} ${detail}`.trim());
  }
}

// VERBOSE-gated screenshot of the failing page. When SCREENSHOT_BUCKET is set
// (the deployed function — see screenshots.tf) it's uploaded to that GCS bucket,
// since the serverless runtime's local /tmp is ephemeral and lost on instance
// recycle. Otherwise (local smoke runs) it's written to SCREENSHOT_DIR or the OS
// temp dir. Either way it's keyed by state code so concurrent sweeps don't
// collide, and the location is logged. Best-effort: a screenshot failure must
// never mask the original error, so it's caught and logged rather than thrown.
async function captureFailureScreenshot(
  page: Page,
  stateCode: string,
): Promise<void> {
  if (!isVerbose()) return;
  try {
    // Bounded timeout: page.screenshot waits for fonts to load and would
    // otherwise hang the default 30s on a broken/error page — costly against the
    // function's timeout budget, and pointless when we just want the visual state.
    const png = await page.screenshot({
      fullPage: true,
      animations: "disabled",
      timeout: 8_000,
    });

    const bucket = process.env["SCREENSHOT_BUCKET"];
    if (bucket) {
      const objectName = `${stateCode}/${Date.now()}.png`;
      await uploadToGcs(bucket, objectName, png);
      console.error(
        `[monitor] failure screenshot uploaded: gs://${bucket}/${objectName}`,
      );
    } else {
      const dir = process.env["SCREENSHOT_DIR"] ?? os.tmpdir();
      mkdirSync(dir, { recursive: true });
      const file = path.join(
        dir,
        `synthetic-monitor-${stateCode}-${Date.now()}.png`,
      );
      writeFileSync(file, png);
      console.error(`[monitor] failure screenshot saved: ${file}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[monitor] could not capture failure screenshot: ${message}`);
  }
}

// On failure, record where the run actually was — the current URL, page title,
// and visible text — to Cloud Logging (always, not VERBOSE-gated, since this
// only fires on failures). Distinguishes "stuck on Auth0" vs "app error/loading"
// vs "app rendered but the element is missing", which a bare selector timeout
// can't tell you. When VERBOSE is on, also saves a screenshot of the failing
// page so the visual state (not just the text) is inspectable.
export async function logFailureContext(
  page: Page,
  stateCode: string,
): Promise<void> {
  try {
    const url = page.url();
    const title = await page.title().catch(() => "(unknown)");
    const text = await page
      .locator("body")
      .innerText({ timeout: 5_000 })
      .catch(() => "(unavailable)");
    console.error(
      `[monitor] failure context — url=${url} title=${JSON.stringify(title)}`,
    );
    console.error(
      `[monitor] visible text: ${text.replace(/\s+/g, " ").trim().slice(0, 800)}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[monitor] could not capture failure context: ${message}`);
  }
  await captureFailureScreenshot(page, stateCode);
}

// Sends `Fastly-Debug: 1` on requests to the dashboard host ONLY. The header
// makes the CDN emit its diagnostic response headers (fastly-debug-path/ttl +
// surrogate-key), which a TRACE run's HAR then records — showing which edge
// node served each request and its cache state (MISS vs HIT).
//
// Scoped per-request rather than set context-wide (extraHTTPHeaders) because
// Fastly-Debug is not a CORS-safelisted header: sent cross-origin it fails the
// preflight — e.g. Auth0's /oauth/token rejects it with "Request header field
// fastly-debug is not allowed by Access-Control-Allow-Headers", which broke
// sign-in on TRACE runs. Route-injected headers only touch requests to the
// Fastly-fronted dashboard origin, where no preflight is involved.
export async function sendFastlyDebugHeader(
  context: BrowserContext,
  appUrl: string,
): Promise<void> {
  const dashboardHost = new URL(appUrl).host;
  await context.route("**/*", async (route) => {
    const request = route.request();
    if (new URL(request.url()).host === dashboardHost) {
      await route.continue({
        headers: { ...request.headers(), "Fastly-Debug": "1" },
      });
    } else {
      await route.continue();
    }
  });
}

// TRACE-gated HAR (HTTP Archive) recording. Returns a temp path to record into
// when TRACE is on, else undefined; the caller passes it to
// browser.newContext({ recordHar: { path } }) and Playwright writes the HAR when
// that context closes. HAR captures every request's timing/status/size — the full
// network trace behind a slow or hung run.
export function harRecordingPath(stateCode: string): string | undefined {
  if (!isTrace()) return undefined;
  return path.join(
    os.tmpdir(),
    `synthetic-monitor-${stateCode}-${Date.now()}.har`,
  );
}

// Uploads the recorded HAR to the screenshots bucket. Failures go to
// <STATE>/<ts>.har (alongside the failure screenshot); successes go to
// success/<STATE>/<ts>.har so the pass baseline stays separate from the failure
// diagnostics and can be compared against it (e.g. TTFB/cache-state of the same
// assets on a good run vs a bad one). `harPath` is what harRecordingPath returned
// (undefined ⇒ TRACE off ⇒ no-op). The recording context must already be closed so
// the HAR is fully flushed. Best-effort: never masks the original error.
export async function uploadHar(
  harPath: string | undefined,
  stateCode: string,
  failed: boolean,
): Promise<void> {
  if (!harPath) return;
  const bucket = process.env["SCREENSHOT_BUCKET"];
  if (!bucket) {
    // Local run: keep the file (outside the try/finally below, whose cleanup
    // would delete it) so it can actually be inspected.
    console.error(
      `[monitor] HAR recorded but SCREENSHOT_BUCKET unset; left at ${harPath}`,
    );
    return;
  }
  try {
    const prefix = failed ? stateCode : `success/${stateCode}`;
    const objectName = `${prefix}/${Date.now()}.har`;
    await uploadToGcs(
      bucket,
      objectName,
      readFileSync(harPath),
      "application/json",
    );
    console.error(
      `[monitor] ${failed ? "failure" : "success"} HAR uploaded: gs://${bucket}/${objectName}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[monitor] could not upload HAR: ${message}`);
  } finally {
    // Instances are reused; drop the local file so /tmp doesn't accumulate.
    try {
      rmSync(harPath, { force: true });
    } catch {
      /* ignore cleanup errors */
    }
  }
}
