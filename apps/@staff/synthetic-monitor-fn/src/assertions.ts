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

// Per-state post-login assertions
// Keep state differences DATA-DRIVEN in this map rather than forking the code —
// the sign-in flow itself is identical across states.

export interface StateAssertion {
  /**
   * Selector that must appear after sign-in for the check to pass. The profile
   * dropdown only renders once the authenticated app shell has loaded, so it's
   * a good generic "we're signed in" signal; override per state when a tighter
   * check is warranted (e.g. a state-specific landing element).
   */
  authenticatedSelector: string;
}

/** Applied to any state without an explicit override below. */
export const DEFAULT_ASSERTION: StateAssertion = {
  authenticatedSelector: ".ProfileDropdownButton",
};

/**
 * Per-state overrides, keyed by STATE_CODE (e.g. "US_IA"). Add an entry only
 * when a state needs something different from DEFAULT_ASSERTION.
 */
export const STATE_ASSERTIONS: Record<string, StateAssertion> = {
  // US_NY lands on Pathways (no .ProfileDropdownButton); #page-title renders
  // at any viewport, unlike .MobileNavigation (mobile-only, and Playwright's
  // default 1280px viewport sits exactly on the mobile breakpoint boundary).
  US_NY: { authenticatedSelector: "#page-title" },
};

export function assertionForState(stateCode: string): StateAssertion {
  return STATE_ASSERTIONS[stateCode] ?? DEFAULT_ASSERTION;
}
