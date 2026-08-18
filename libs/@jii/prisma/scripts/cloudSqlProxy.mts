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

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { $ } from "zx";

// This script has two phases: a startup phase (ensures the CloudSQL Proxy service starts up
// with fresh credentials) and a watch phase (keeps the credentials fresh).

// --- Utility functions and constants ---

$.verbose = false;

/**
 * Checks whether gcloud's Application Default Credentials are still valid,
 * by asking gcloud to mint an access token from them. This will fail if the session is expired.
 */
async function isAdcValid(): Promise<boolean> {
  try {
    await $`gcloud auth application-default print-access-token`.quiet();
    return true;
  } catch {
    return false;
  }
}

/**
 * Refreshes gcloud's Application Default Credentials by launching the
 * interactive login flow in your browser.
 */
async function refreshAdc(): Promise<void> {
  // Timeout for reauth attempts so they don't hang forever during watch
  const REAUTH_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  console.log(
    "🔑 gcloud ADC credentials are missing or expired — triggering reauth. " +
      "Check your browser to finish sign-in.",
  );
  await $`gcloud auth login --update-adc`
    .stdio("inherit")
    // timeout is important so it doesn't stall the entire script,
    // which also watches for out-of-band credential refreshes
    .timeout(REAUTH_TIMEOUT_MS);
}

function getCredentialLastModified(): number {
  // where your Application Default Credentials are expected to be when you auth via gcloud CLI
  const ADC_PATH = path.join(
    os.homedir(),
    ".config/gcloud/application_default_credentials.json",
  );

  return fs.statSync(ADC_PATH).mtimeMs;
}

/**
 * Restarts CloudSQL Proxy docker container.
 * Safe to call anytime, will no-op if the container doesn't exist.
 */
async function restartProxy(): Promise<void> {
  await $`docker compose restart cloudsql-proxy`.nothrow().pipe(process.stdout);
}

// --- Script tasks ---

/**
 * Startup phase: get a fresh container running with valid credentials
 */
async function startProxy() {
  // check credentials and prompt for reauth if needed
  if (!(await isAdcValid())) {
    await refreshAdc();
  }

  // The container may already be running from a previous session with a
  // now-stale credential, so try to restart it first.
  // Will be a no-op if the container isn't already running.
  await restartProxy();
  // Conversely, this will be a no-op if the container IS already running,
  // and will start it with fresh credentials otherwise.
  await $`docker compose up --wait cloudsql-proxy`.pipe(process.stdout);
  // The combination of both docker commands above ensures you'll always get a valid proxy connection
  // when starting this script, whether this is a fresh start or a restart.
}

/**
 * Watch phase: keep credentials fresh and the container in sync
 */
async function watchCredentialsAndRefresh() {
  const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  let activeCredentialLastModified = getCredentialLastModified();

  /* eslint-disable no-await-in-loop -- this loop is intentionally sequential:
     each iteration's check/refresh/restart must finish before the next starts */
  while (true) {
    try {
      // check for valid credentials and prompt for reauth if needed. Same thing we do during the startup phase
      if (!(await isAdcValid())) {
        await refreshAdc();
      }

      // check for modified credential and restart proxy if needed.
      // the file may have been modified by the refreshAdc() call above,
      // or by a manual reauth executed in another terminal; watching the file itself will catch both.
      const latestCredentialLastModified = getCredentialLastModified();
      if (latestCredentialLastModified !== activeCredentialLastModified) {
        activeCredentialLastModified = latestCredentialLastModified;
        console.log(
          "🔄 gcloud ADC credentials changed — restarting cloudsql-proxy so it picks them up.",
        );
        await restartProxy();
      }
    } catch (e) {
      console.error(
        "⚠️  cloudsql-proxy: error during this check, will retry:",
        e,
      );
    }

    // pause for the specified interval before running the loop again
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

// --- Script execution ---

await startProxy();
await watchCredentialsAndRefresh();
