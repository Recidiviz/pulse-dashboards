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

import { RefObject, useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";

export const ScrollLayout = styled.div`
  display: flex;
`;

export const StickyAxis = styled.svg`
  flex-shrink: 0;

  text {
    fill: ${({ theme }) => theme.typography.axisLabel.color};
    font-family: ${({ theme }) => theme.typography.axisLabel.fontFamily};
    font-weight: ${({ theme }) => theme.typography.axisLabel.fontWeight};
    font-size: ${({ theme }) => theme.typography.axisLabel.fontSize};
    line-height: ${({ theme }) => theme.typography.axisLabel.lineHeight};
    letter-spacing: ${({ theme }) => theme.typography.axisLabel.letterSpacing};
  }
`;

export const ScrollWrapper = styled.div<{
  $fadeRight: boolean;
  $fadeLeft: boolean;
}>`
  flex: 1;
  min-width: 0;
  overflow: clip;
  position: relative;

  ${({ $fadeRight, $fadeLeft }) => {
    if ($fadeRight && $fadeLeft) {
      return css`
        mask-image: linear-gradient(
          to right,
          transparent,
          white 8%,
          white 92%,
          transparent
        );
      `;
    }
    if ($fadeRight) {
      return css`
        mask-image: linear-gradient(to left, transparent, white 8%);
      `;
    }
    if ($fadeLeft) {
      return css`
        mask-image: linear-gradient(to right, transparent, white 8%);
      `;
    }
    return "";
  }}
`;

type UseChartScrollOptions = {
  needsScroll: boolean;
  scrollWidth: number | undefined;
  itemCount: number;
  leftMargin: number;
  rightMargin: number;
};

type UseChartScrollResult = {
  scrollRef: RefObject<HTMLDivElement | null>;
  wrapperRef: RefObject<HTMLDivElement | null>;
  scrollOffset: number;
  fadeRight: boolean;
  fadeLeft: boolean;
};

export function useChartScroll({
  needsScroll,
  scrollWidth,
  itemCount,
  leftMargin,
  rightMargin,
}: UseChartScrollOptions): UseChartScrollResult {
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Wheel + touch scrolling
  const scrollOffsetRef = useRef(scrollOffset);
  scrollOffsetRef.current = scrollOffset;

  useEffect(() => {
    if (!needsScroll) return;
    const el = scrollRef.current;
    if (!el) return;

    const clamp = (value: number) => {
      const maxVal = Math.max(0, (scrollWidth ?? 0) - el.clientWidth);
      return Math.max(0, Math.min(maxVal, value));
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      setScrollOffset((prev) => clamp(prev + e.deltaX));
      e.preventDefault();
    };

    let touchStartX = 0;
    let touchStartOffset = 0;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartOffset = scrollOffsetRef.current;
    };

    const onTouchMove = (e: TouchEvent) => {
      const delta = touchStartX - e.touches[0].clientX;
      setScrollOffset(() => clamp(touchStartOffset + delta));
      e.preventDefault();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [needsScroll, scrollWidth]);

  // Keyboard navigation
  const keyNavIndexRef = useRef(-1);
  useEffect(() => {
    if (!needsScroll) return;
    const el = scrollRef.current;
    const wrapper = wrapperRef.current;
    if (!el || !wrapper) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;

      if (e.key === "ArrowRight") {
        keyNavIndexRef.current = Math.min(
          keyNavIndexRef.current + 1,
          itemCount - 1,
        );
      } else {
        keyNavIndexRef.current = Math.max(keyNavIndexRef.current - 1, 0);
      }

      const idx = keyNavIndexRef.current;
      const containerWidth = el.clientWidth;
      const chartArea = (scrollWidth ?? 0) - leftMargin - rightMargin;
      const colWidth = chartArea / itemCount;
      const itemLeft = leftMargin + idx * colWidth;
      const itemRight = itemLeft + colWidth;

      const PAD = colWidth * 4;
      setScrollOffset((prev) => {
        const maxVal = Math.max(0, (scrollWidth ?? 0) - containerWidth);
        if (itemRight + PAD > prev + containerWidth) {
          return Math.min(maxVal, itemRight + PAD - containerWidth);
        }
        if (itemLeft - PAD < prev) {
          return Math.max(0, itemLeft - PAD);
        }
        return prev;
      });
    };

    wrapper.addEventListener("keydown", onKeyDown, true);
    return () => wrapper.removeEventListener("keydown", onKeyDown, true);
  }, [needsScroll, scrollWidth, itemCount, leftMargin, rightMargin]);

  const fadeRight =
    needsScroll &&
    scrollOffset <
      (scrollWidth ?? 0) - (scrollRef.current?.clientWidth ?? 0) - 1;
  const fadeLeft = needsScroll && scrollOffset > 0;

  return { scrollRef, wrapperRef, scrollOffset, fadeRight, fadeLeft };
}
