// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { RefObject, useEffect, useRef } from "react";

export function useAutoScroll(
  containerRef: RefObject<HTMLElement | null>,
  dependencies: unknown[] = [],
  threshold = 5,
) {
  const atBottomRef = useRef(true);

  // Track when the user is at the bottom of the container within a threshold
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const onScroll = () => {
      atBottomRef.current =
        element.scrollHeight - element.scrollTop - element.clientHeight <=
        threshold;
    };

    element.addEventListener("scroll", onScroll);
    return () => element.removeEventListener("scroll", onScroll);
  }, [containerRef, threshold]);

  // Whenever dependencies change (e.g. messages), if we're at bottom, scroll down so the user sees the latest messages
  useEffect(() => {
    const element = containerRef.current;
    if (element && atBottomRef.current) {
      element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
    }
  }, [containerRef, ...dependencies]);
}
