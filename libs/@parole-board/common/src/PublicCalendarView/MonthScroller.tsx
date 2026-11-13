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

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { EdgeFade, Scroller, ScrollFrame } from "./PublicCalendarView.styles";

// scrollLeft can land a fraction of a pixel short of either end.
const EDGE_TOLERANCE = 1;

/**
 * The month grid's sideways scroll area. The grid keeps its minimum width, so
 * on a screen narrower than that the columns scroll instead of squeezing,
 * the weekday row scrolls with them and the page header stays put. A fade
 * marks each side that has more columns to scroll to. The area is a named
 * region that takes focus, so arrow keys scroll it. With inert, nothing in the
 * area responds: it's out of the tab order, hidden from screen readers, and
 * can't be scrolled, clicked or selected.
 *
 * When the month opens, a grid wider than the screen scrolls scrollToDate's
 * cell into view. A grid that fits doesn't move.
 */
export function MonthScroller({
  label,
  scrollToDate,
  inert = false,
  children,
}: {
  label: string;
  /** "YYYY-MM-DD"; from initialScrollDate. */
  scrollToDate: string | null;
  /**
   * True while the grid shows but can't be used, as for a month that's no
   * longer live.
   */
  inert?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setEdges({
      start: el.scrollLeft > EDGE_TOLERANCE,
      end: el.scrollLeft < maxScroll - EDGE_TOLERANCE,
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    measure();
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => {
    // Waits a frame for FullCalendar to lay out the new month's cells.
    const frame = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el || !scrollToDate || el.scrollWidth <= el.clientWidth) return;
      el.querySelector(`[data-date="${scrollToDate}"]`)?.scrollIntoView({
        block: "nearest",
        inline: "start",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollToDate]);

  return (
    <ScrollFrame inert={inert}>
      <Scroller
        ref={ref}
        role="region"
        aria-label={label}
        // A scroll area with nothing focusable inside needs to take focus
        // itself, or a keyboard can't scroll it.
        tabIndex={0}
        onScroll={measure}
      >
        {children}
      </Scroller>
      {edges.start && <EdgeFade $side="start" aria-hidden />}
      {edges.end && <EdgeFade $side="end" aria-hidden />}
    </ScrollFrame>
  );
}
