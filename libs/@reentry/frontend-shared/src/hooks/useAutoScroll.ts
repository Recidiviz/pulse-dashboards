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

import { type DependencyList, useEffect, useRef, useState } from "react";

const BOTTOM_THRESHOLD = 50;

/**
 * Manages auto-scrolling for a chat message list.
 *
 * Handles three scroll scenarios:
 * 1. New content (messages, typing indicator) — scrolls if user was at bottom
 * 2. Keyboard open — re-scrolls after container resize
 * 3. Manual scroll — shows "more messages" button when not at bottom
 */
export function useAutoScroll(deps: DependencyList) {
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wasAtBottomRef = useRef(true);
  const isAutoScrollingRef = useRef(false);

  const scrollToBottom = () => {
    isAutoScrollingRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const onScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      BOTTOM_THRESHOLD;

    wasAtBottomRef.current = isAtBottom;

    if (isAtBottom) {
      isAutoScrollingRef.current = false;
      setShowScrollButton(false);
    } else if (!isAutoScrollingRef.current) {
      setShowScrollButton(true);
    }
  };

  // Auto-scroll when deps change (new messages, typing indicator, etc.)
  useEffect(() => {
    if (wasAtBottomRef.current) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Re-scroll after container shrinks (e.g. keyboard open)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let previousHeight = container.clientHeight;

    const observer = new ResizeObserver((entries) => {
      const newHeight = entries[0].contentRect.height;
      if (newHeight < previousHeight) {
        const wasAtBottom =
          container.scrollHeight - container.scrollTop - previousHeight <
          BOTTOM_THRESHOLD;
        if (wasAtBottom) {
          messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
        }
      }
      previousHeight = newHeight;
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return {
    scrollContainerRef,
    messagesEndRef,
    showScrollButton,
    scrollToBottom,
    onScroll,
  };
}
