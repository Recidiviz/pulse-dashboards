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
  ReactNode,
  RefObject,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import useMeasure from "react-use-measure";

import {
  StyledTooltip,
  TooltipPlacement,
} from "./RiskAssessmentSection.styles";

/**
 * Returns the horizontal shift (px) that moves a tooltip back inside its chart.
 * A tooltip too wide to fit splits its overhang evenly between both sides.
 * @param tooltipLeft - Left edge of the tooltip, in viewport px.
 * @param tooltipRight - Right edge of the tooltip, in viewport px.
 * @param containerLeft - Left edge of the chart, in viewport px.
 * @param containerRight - Right edge of the chart, in viewport px.
 * @param viewportWidth - Window width, so a chart past the screen edge is cut to it.
 */
export function horizontalOffsetToFit({
  tooltipLeft,
  tooltipRight,
  containerLeft,
  containerRight,
  viewportWidth,
}: {
  tooltipLeft: number;
  tooltipRight: number;
  containerLeft: number;
  containerRight: number;
  viewportWidth: number;
}): number {
  const left = Math.max(containerLeft, 0);
  const right = Math.min(containerRight, viewportWidth);

  const overhangLeft = left - tooltipLeft;
  const overhangRight = tooltipRight - right;

  if (overhangLeft > 0 && overhangRight > 0)
    return (overhangLeft - overhangRight) / 2;
  if (overhangRight > 0) return -overhangRight;
  if (overhangLeft > 0) return overhangLeft;
  return 0;
}

/**
 * Returns "below" when a tooltip above its point would be cut off by the top
 * of the chart or the window, else "above".
 * @param tooltipTop - Top edge of the tooltip in its default spot, in viewport px.
 * @param containerTop - Top edge of the chart, in viewport px.
 */
export function verticalPlacementToFit({
  tooltipTop,
  containerTop,
}: {
  tooltipTop: number;
  containerTop: number;
}): TooltipPlacement {
  return tooltipTop < Math.max(containerTop, 0) ? "below" : "above";
}

/**
 * Measures a chart's size and keeps a ref to the same element for
 * EdgeAwareTooltip. The tooltip needs the ref because useMeasure's bounds go
 * stale when the page scrolls.
 * @returns The ref callback for the chart element, its measured bounds, and
 * the ref to pass to EdgeAwareTooltip.
 */
export function useChartContainer() {
  const [measureRef, bounds] = useMeasure();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setContainer = useCallback(
    (element: HTMLDivElement | null) => {
      containerRef.current = element;
      measureRef(element);
    },
    [measureRef],
  );
  return { setContainer, bounds, containerRef };
}

/**
 * Chart tooltip that stays inside its chart. It shifts sideways at the left
 * and right edges, and flips below its point at the top edge.
 * @param containerRef - The chart element the tooltip must stay inside.
 * @param resetKey - Identifies the hovered point. A new key measures again.
 * @param children - Tooltip content.
 */
export function EdgeAwareTooltip({
  containerRef,
  resetKey,
  children,
}: {
  containerRef: RefObject<HTMLElement | null>;
  resetKey: string;
  children: ReactNode;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<{
    key: string;
    offsetX: number;
    placement: TooltipPlacement;
  } | null>(null);
  const isCurrent = measured?.key === resetKey;

  useLayoutEffect(() => {
    if (isCurrent) return;
    const tooltip = tooltipRef.current;
    const container = containerRef.current;
    if (!tooltip || !container) return;

    const tooltipRect = tooltip.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    setMeasured({
      key: resetKey,
      offsetX: horizontalOffsetToFit({
        tooltipLeft: tooltipRect.left,
        tooltipRight: tooltipRect.right,
        containerLeft: containerRect.left,
        containerRight: containerRect.right,
        viewportWidth: window.innerWidth,
      }),
      placement: verticalPlacementToFit({
        tooltipTop: tooltipRect.top,
        containerTop: containerRect.top,
      }),
    });
    // isCurrent depends on measured, which this effect sets -- deps are the
    // real inputs, not isCurrent itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, containerRef]);

  return (
    <StyledTooltip
      ref={tooltipRef}
      $offsetX={isCurrent ? measured.offsetX : 0}
      $placement={isCurrent ? measured.placement : "above"}
    >
      {children}
    </StyledTooltip>
  );
}
