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

import { ReactNode, useLayoutEffect, useRef, useState } from "react";
import type { RectReadOnly } from "react-use-measure";

import { StyledTooltip } from "./RiskAssessmentSection.styles";

/**
 * StyledTooltip centers on its anchor, which can push it past the chart's
 * edge (e.g. two charts sharing a row). This measures the tooltip against
 * the chart's own bounds and nudges it back inside horizontally.
 */
export function EdgeAwareTooltip({
  containerBounds,
  // Identifies the currently-anchored point/bar; changing it resets the
  // offset so a stale correction doesn't leak into the next one.
  resetKey,
  children,
}: {
  containerBounds: Pick<RectReadOnly, "left" | "right">;
  resetKey: string;
  children: ReactNode;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<{
    key: string;
    offsetX: number;
  } | null>(null);
  const isCurrent = measured?.key === resetKey;

  useLayoutEffect(() => {
    if (isCurrent) return;
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const tooltipRect = tooltip.getBoundingClientRect();
    let offsetX = 0;
    if (tooltipRect.right > containerBounds.right) {
      offsetX = containerBounds.right - tooltipRect.right;
    } else if (tooltipRect.left < containerBounds.left) {
      offsetX = containerBounds.left - tooltipRect.left;
    }
    setMeasured({ key: resetKey, offsetX });
    // isCurrent depends on measured, which this effect sets -- deps are the
    // real inputs, not isCurrent itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, containerBounds.left, containerBounds.right]);

  return (
    <StyledTooltip ref={tooltipRef} $offsetX={isCurrent ? measured.offsetX : 0}>
      {children}
    </StyledTooltip>
  );
}
