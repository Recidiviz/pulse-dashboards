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

// Entry point for the staff sign-in Synthetic Monitor (GCP Cloud Monitoring).
//
// Deployed as a 2nd-gen Cloud Function and invoked on a schedule by the
// `apps/staff-synthetic-monitor` Terraform component's uptime check
// (synthetic_monitor → cloud_function_v2). runSyntheticHandler (./handler) wraps
// the test body: it times the run, captures pass/fail, and serializes the
// SyntheticResult the monitor expects — we just throw on failure.
//
// Chromium comes from @sparticuz/chromium (a serverless-friendly build that fits
// the Cloud Functions runtime) and is driven by playwright-core. The two are
// version-locked: @sparticuz/chromium 131.x ships Chromium 131, which
// playwright-core 1.49.x supports — see runtime/package.json + README.

import { chromium } from "playwright-core";

import { assertionForState } from "./assertions";
import { resolveLaunchOptions } from "./browser";
import { loadConfig } from "./config";
import {
  collectNetworkFailures,
  collectPageErrors,
  collectPendingRequests,
  harRecordingPath,
  logFailureContext,
  sendFastlyDebugHeader,
  streamBrowserConsole,
  uploadHar,
} from "./diagnostics";
import { runSyntheticHandler } from "./handler";
import { log } from "./log";
import { signIn } from "./login";
import { verificationForState } from "./verifications";

export const SyntheticFunction = runSyntheticHandler(async () => {
  const config = loadConfig();
  const assertion = assertionForState(config.stateCode);
  const verify = verificationForState(config.stateCode);

  log(`launching browser for ${config.stateCode}`);
  const browser = await chromium.launch(await resolveLaunchOptions());
  log("browser launched");

  // TRACE-gated: record a HAR of the whole run (uploaded to the screenshots
  // bucket on failure). Recording is a context option, so we create the context
  // explicitly rather than using browser.newPage(); the HAR is written on close.
  const harPath = harRecordingPath(config.stateCode);
  const context = await browser.newContext(
    harPath ? { recordHar: { path: harPath, content: "omit" } } : {},
  );
  // Coupled to HAR recording since the HAR is what captures the Fastly
  // diagnostic response headers the Fastly-Debug request header elicits.
  // Dashboard-host-only: sent cross-origin (Auth0/analytics) the non-safelisted
  // header fails CORS preflights and breaks sign-in — see sendFastlyDebugHeader.
  if (harPath) {
    await sendFastlyDebugHeader(context, config.url);
  }

  let failed = false;
  try {
    const page = await context.newPage();
    log("page created");
    streamBrowserConsole(page);
    const getPageErrors = collectPageErrors(page);
    const getNetworkFailures = collectNetworkFailures(page);
    const getPendingRequests = collectPendingRequests(page);
    try {
      await signIn(page, config, assertion);
      log("running verification");
      await verify(page, config);
      log("verification passed");
    } catch (err) {
      failed = true;
      await logFailureContext(page, config.stateCode);
      const networkFailures = getNetworkFailures();
      if (networkFailures.length > 0) {
        console.error(
          `[monitor] network failures (${networkFailures.length}):\n${networkFailures.slice(0, 20).join("\n")}`,
        );
      }
      // What the page was still waiting on — names the culprit when the app
      // booted but a data request hung (a slow XHR never fires requestfailed).
      const pendingRequests = getPendingRequests();
      if (pendingRequests.length > 0) {
        console.error(
          `[monitor] ${pendingRequests.length} request(s) still pending at failure:\n${pendingRequests.slice(0, 20).join("\n")}`,
        );
      }
      const pageErrors = getPageErrors();
      if (pageErrors.length > 0) {
        console.error(
          `[monitor] page errors (${pageErrors.length}):\n${pageErrors.slice(0, 12).join("\n")}`,
        );
      }
      throw err;
    }
  } finally {
    // Guarded teardown: a close error (e.g. crashed browser) must not mask the
    // test error or skip the HAR upload. Context first so the HAR is flushed.
    const logTeardownError = (step: string) => (err: unknown) =>
      console.error(
        `[monitor] ${step} failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    await context.close().catch(logTeardownError("context.close"));
    await browser.close().catch(logTeardownError("browser.close"));
    await uploadHar(harPath, config.stateCode, failed);
  }
});
