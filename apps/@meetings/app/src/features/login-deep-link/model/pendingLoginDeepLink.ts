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

// Preserves the URL a logged-out user requested across the Auth0 login
// redirect, which returns the browser to the origin. Web only; no-ops on
// native (window exists there, sessionStorage does not).

const STORAGE_KEY = "pendingLoginDeepLink";

// Tab-scoped, matching a login redirect; access can throw (storage disabled)
function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage ?? null;
  } catch {
    return null;
  }
}

function isRestorablePath(pathname: string, search: string): boolean {
  if (pathname === "/" || pathname === "/login") return false;
  // Never treat an Auth0 redirect callback as a deep link
  const params = new URLSearchParams(search);
  if (params.has("code") && params.has("state")) return false;
  if (params.has("error")) return false;
  return true;
}

// Saves the current URL for post-login restore. Safe to call every render:
// once the URL is rewritten to /login, calls no-op and the capture is kept.
export function savePendingLoginDeepLink(): void {
  const storage = getSessionStorage();
  if (!storage) return;
  const { pathname, search } = window.location;
  if (!isRestorablePath(pathname, search)) return;
  try {
    storage.setItem(STORAGE_KEY, `${pathname}${search}`);
  } catch {
    // Failed save = default screen after login
  }
}

// Returns the saved deep link without clearing it.
export function peekPendingLoginDeepLink(): string | null {
  const storage = getSessionStorage();
  if (!storage) return null;
  try {
    return storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

// Returns the saved deep link and clears it, so at most one caller navigates.
export function takePendingLoginDeepLink(): string | null {
  const storage = getSessionStorage();
  if (!storage) return null;
  try {
    const path = storage.getItem(STORAGE_KEY);
    storage.removeItem(STORAGE_KEY);
    return path;
  } catch {
    return null;
  }
}
