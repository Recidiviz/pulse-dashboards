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

import type { Page } from "playwright-core";

import type { StateAssertion } from "./assertions";
import type { SyntheticMonitorConfig } from "./config";
import { log } from "./log";

// Auth0 universal-login (identifier-first) selectors. Mirrors the staff app's
// existing cucumber login page object so the monitor breaks in lockstep with
// the real login flow:
// apps/staff/src/cucumber/pages/loginPage.js:25-44
export const LOGIN_SELECTORS = {
  username: "input#username",
  password: 'input[type="password"]',
  submit: 'button[type="submit"]',
} as const;

// 45s (up from 30s): the deployed serverless runtime occasionally takes longer
// than a local run to reach the authenticated app shell after Auth0 redirects
// back — a 30s wait flaked on the tail. Local smoke runs sign in in ~3-8s, so
// this only adds headroom for the slow-tail deployed runs.
const NAVIGATION_TIMEOUT_MS = 45_000;

/**
 * Drives the staff app's Auth0 sign-in end to end:
 *   1. Navigate to the app (which redirects to Auth0 universal login).
 *   2. Enter the email, continue, enter the password, continue.
 *   3. Wait for the state's authenticated assertion selector to render.
 *
 * Any failure — navigation timeout, missing field, or the assertion selector
 * never appearing — throws, which is what marks the synthetic check as failed.
 */
export async function signIn(
  page: Page,
  { url, username, password }: SyntheticMonitorConfig,
  assertion: StateAssertion,
): Promise<void> {
  log(`navigating to ${url}`);
  // domcontentloaded, NOT load: network intermittently drops or truncates non-critical sub-resources,
  // and `waitUntil: "load"` blocks on them.
  // We assert the authenticated element explicitly below, so the `load` event is superfluous
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: NAVIGATION_TIMEOUT_MS,
  });

  // Identifier-first Auth0 flow: email → continue → password → continue.
  log("entering username");
  await page.fill(LOGIN_SELECTORS.username, username);
  await page.click(LOGIN_SELECTORS.submit);
  log("entering password");
  await page.fill(LOGIN_SELECTORS.password, password);
  await page.click(LOGIN_SELECTORS.submit);

  log(`waiting for authenticated element (${assertion.authenticatedSelector})`);
  await page.waitForSelector(assertion.authenticatedSelector, {
    timeout: NAVIGATION_TIMEOUT_MS,
  });
  log("signed in");
}
