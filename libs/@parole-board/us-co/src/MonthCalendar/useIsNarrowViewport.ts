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

import { useSyncExternalStore } from "react";

/**
 * Below 768px a seven-column grid leaves each day too narrow for its chips,
 * so the calendar switches to the list view. The design has no narrow
 * layout, and editors work on desktop, so this is only a fallback.
 */
export const NARROW_VIEWPORT_QUERY = "(max-width: 767px)";

// Environments without matchMedia, such as jsdom, count as wide.
const mediaQuery = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(NARROW_VIEWPORT_QUERY)
    : null;

function subscribe(onChange: () => void) {
  const query = mediaQuery();
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
}

const isNarrow = () => mediaQuery()?.matches ?? false;

/** Whether the viewport is narrower than 768px, updated as it resizes. */
export function useIsNarrowViewport(): boolean {
  return useSyncExternalStore(subscribe, isNarrow, () => false);
}
