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

export function isAbortException(error: Error): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

// What each engine says when fetch rejects without a response, lowercased.
// The type alone is not enough: fetch rejects with a plain TypeError, which is
// also what calling a non-function raises.
const NETWORK_FAILURE_MESSAGES = [
  "failed to fetch", // Chrome, Edge
  "networkerror when attempting to fetch resource", // Firefox
  "load failed", // Safari
];

/**
 * Whether a rejection is a fetch that never got a response.
 *
 * This covers a request the browser cancelled, but also a CORS or CSP block,
 * a DNS failure, and a refused connection, which are real defects. Pair it
 * with isPageUnloading to tell the two apart.
 */
export function isNetworkFailure(error: unknown): boolean {
  if (!(error instanceof TypeError)) return false;
  const message = error.message.toLowerCase();
  return NETWORK_FAILURE_MESSAGES.some((known) => message.includes(known));
}

let pageUnloading = false;
let unloadTrackingInstalled = false;

/**
 * Starts tracking whether the page is on its way out. Safe to call more than
 * once.
 *
 * Listens for pagehide rather than beforeunload, because a beforeunload prompt
 * the user dismisses leaves the page alive. The browser fires pagehide before
 * it cancels the page's in-flight requests, so the flag is already set when
 * their rejections arrive. A page restored from the back/forward cache fires
 * pageshow and is live again.
 */
export function trackPageUnload(): void {
  if (unloadTrackingInstalled) return;
  unloadTrackingInstalled = true;
  window.addEventListener("pagehide", () => {
    pageUnloading = true;
  });
  window.addEventListener("pageshow", () => {
    pageUnloading = false;
  });
}

export function isPageUnloading(): boolean {
  return pageUnloading;
}

/**
 * Whether an error is a request the browser cancelled because the user left
 * the page. Nothing can act on one, and no one sees its result.
 */
export function isUnloadCancellation(error: unknown): boolean {
  return isPageUnloading() && isNetworkFailure(error);
}
