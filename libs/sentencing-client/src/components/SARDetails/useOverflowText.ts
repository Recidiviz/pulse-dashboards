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

import { useEffect, useRef, useState } from "react";

/**
 * Custom hook to handle text overflow with "+ x more" logic.
 * Measures how many items from an array can fit in the container,
 * and displays the rest as "+ x more".
 */
export function useOverflowText(items: string[]) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [displayText, setDisplayText] = useState(items.join(", "));

  useEffect(() => {
    if (!containerRef.current || items.length === 0) return;

    const container = containerRef.current;
    const fullText = items.join(", ");

    // Temporarily show full text to measure
    container.textContent = fullText;

    // Check if text overflows
    if (container.scrollWidth <= container.clientWidth) {
      setDisplayText(fullText);
      return;
    }

    // Binary search to find how many items fit
    let visibleCount = items.length - 1;

    while (visibleCount > 0) {
      const remaining = items.length - visibleCount;
      const testText = `${items.slice(0, visibleCount).join(", ")} + ${remaining} more`;
      container.textContent = testText;

      if (container.scrollWidth <= container.clientWidth) {
        setDisplayText(testText);
        return;
      }

      visibleCount--;
    }

    // Fallback: show first item + count
    const remaining = items.length - 1;
    setDisplayText(`${items[0]} + ${remaining} more`);
  }, [items]);

  return { containerRef, displayText };
}
