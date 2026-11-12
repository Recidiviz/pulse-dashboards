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

import sparticuzChromium from "@sparticuz/chromium";
import type { LaunchOptions } from "playwright-core";

// @sparticuz/chromium ships a Linux x86-64 Chromium built for the serverless
// runtime. In Cloud Run / Cloud Functions gen2 (which sets K_SERVICE) we launch
// it; anywhere else (e.g. a local macOS smoke test) that binary is the wrong
// platform and `launch` fails with ENOEXEC, so we fall back to a locally
// installed browser.

export function isServerlessRuntime(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return Boolean(env["K_SERVICE"]);
}

/** Watch the run locally with `HEADED=true` (ignored in the serverless runtime). */
export function isHeaded(env: NodeJS.ProcessEnv = process.env): boolean {
  const value = env["HEADED"]?.toLowerCase();
  return value === "1" || value === "true";
}

/** Optional per-action delay (ms) via `SLOWMO`, to make a headed run watchable. */
function slowMo(env: NodeJS.ProcessEnv): number | undefined {
  const ms = Number(env["SLOWMO"]);
  return Number.isFinite(ms) && ms > 0 ? ms : undefined;
}

/**
 * Playwright launch options for the current environment:
 * - `CHROMIUM_EXECUTABLE_PATH` set → use that binary (escape hatch / CI).
 * - serverless runtime → the bundled @sparticuz/chromium binary (always headless).
 * - otherwise (local) → the system-installed Google Chrome (`channel: "chrome"`).
 *
 * Locally, `HEADED=true` shows the browser and `SLOWMO=<ms>` slows it down.
 */
export async function resolveLaunchOptions(
  env: NodeJS.ProcessEnv = process.env,
): Promise<LaunchOptions> {
  const base: LaunchOptions = { headless: !isHeaded(env) };
  const delay = slowMo(env);
  if (delay !== undefined) {
    base.slowMo = delay;
  }

  const override = env["CHROMIUM_EXECUTABLE_PATH"];
  if (override) {
    return { ...base, executablePath: override };
  }

  if (isServerlessRuntime(env)) {
    // The dashboard charts are SVG, so WebGL/GPU isn't needed. @sparticuz/chromium
    // defaults graphics ON (software GL via --use-gl=angle/swiftshader), which is
    // a common cause of newPage() hangs/crashes in the constrained runtime.
    // Disabling it stabilizes Chromium and skips the graphics-driver extraction.
    sparticuzChromium.setGraphicsMode = false;

    // Drop --disable-web-security: it makes the headless browser omit the Origin
    // header on the staff app's cross-origin backend calls, which 500s the
    // backend's CORS check (re.match(origin_pattern, request.origin) with
    // origin=None) and trips the app's error boundary. A real sign-in check
    // wants normal web security anyway.
    const args = sparticuzChromium.args.filter(
      (arg) => arg !== "--disable-web-security",
    );

    return {
      ...base,
      // No display in the serverless runtime — force headless.
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        ...args,
      ],
      executablePath: await sparticuzChromium.executablePath(),
    };
  }

  return { ...base, channel: "chrome" };
}
