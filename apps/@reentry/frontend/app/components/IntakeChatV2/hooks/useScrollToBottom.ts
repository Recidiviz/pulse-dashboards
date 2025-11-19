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

import { RefObject, useCallback, useEffect, useRef, useState } from "react";

interface Options {
  threshold?: number;
}

interface UseScrollToBottomReturn<T extends HTMLElement> {
  ref: RefObject<T | null>;
  showScrollToBottom: boolean;
  scrollToBottom: () => void;
}

export function useScrollToBottom<T extends HTMLElement>({
  threshold = 1,
}: Options = {}): UseScrollToBottomReturn<T> {
  const ref = useRef<T | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const updateButtonVisibility = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    const isOverflowing = element.scrollHeight > element.clientHeight;
    const distanceFromBottom =
      element.scrollHeight - element.clientHeight - element.scrollTop;
    const isAtBottom = distanceFromBottom <= threshold;

    setShowScrollToBottom(isOverflowing && !isAtBottom);
  }, [threshold]);

  const scrollToBottom = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    updateButtonVisibility();

    // Recompute on scroll and resize
    element.addEventListener("scroll", updateButtonVisibility, {
      passive: true,
    });
    window.addEventListener("resize", updateButtonVisibility);

    return () => {
      element.removeEventListener("scroll", updateButtonVisibility);
      window.removeEventListener("resize", updateButtonVisibility);
    };
  }, [updateButtonVisibility]);

  return { ref, showScrollToBottom, scrollToBottom };
}
