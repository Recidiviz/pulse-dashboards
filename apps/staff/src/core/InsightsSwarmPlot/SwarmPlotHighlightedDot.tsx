// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
  autoPlacement,
  autoUpdate,
  FloatingPortal,
  offset,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
} from "@floating-ui/react";
import { spacing } from "@recidiviz/design-system";
import { useState } from "react";

import {
  HIGHLIGHT_MARK_STROKE_WIDTH,
  HIGHLIGHTED_DOT_COLOR_V2,
  SWARM_DOT_RADIUS_V2,
  SWARM_SIZE_BREAKPOINT,
} from "../../InsightsStore/presenters/SwarmPresenter/constants";
import { HighlightedDot } from "../../InsightsStore/presenters/SwarmPresenter/types";
import {
  HighlightLabel,
  LabelName,
  LabelPercent,
  RateHighlightMark,
} from "./styles";
import { formatTargetAndHighlight } from "./utils";

type HighlightedPointProps = {
  data: HighlightedDot;
  r?: number;
  cx: number;
  cy: number;
  plotWidth: number;
  isHoverable?: boolean;
};

function useHoverProps() {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      autoPlacement({ allowedPlacements: ["left", "right"] }),
      offset(spacing.sm),
    ],
    whileElementsMounted: autoUpdate,
  });
  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
  ]);

  return {
    isOpen,
    refs,
    floatingStyles,
    getReferenceProps,
    getFloatingProps,
  };
}

export const SwarmPlotHighlightedDot = function SwarmPlotHighlightedDot({
  data,
  r,
  cx,
  cy,
  plotWidth,
  isHoverable,
}: HighlightedPointProps) {
  const { floatingStyles, getReferenceProps, getFloatingProps, isOpen, refs } =
    useHoverProps();

  const showLabel = !data.labelHidden && isHoverable;
  const isHovered = showLabel && isOpen;

  return (
    <>
      <RateHighlightMark
        tabIndex={0}
        r={r ?? SWARM_DOT_RADIUS_V2}
        cx={cx}
        cy={cy}
        fill={HIGHLIGHTED_DOT_COLOR_V2}
        stroke={isHovered ? `${HIGHLIGHTED_DOT_COLOR_V2}1A` : "transparent"}
        strokeWidth={`${isHovered ? 20 : HIGHLIGHT_MARK_STROKE_WIDTH}px`}
        ref={refs.setReference}
        {...getReferenceProps()}
      />
      <FloatingPortal>
        <HighlightLabel
          ref={refs.setFloating}
          style={floatingStyles}
          $size={plotWidth > SWARM_SIZE_BREAKPOINT ? "lg" : "sm"}
          {...getFloatingProps()}
        >
          {showLabel && (
            <>
              {data.label && <LabelName>{data.label}:</LabelName>}
              &nbsp;
              <LabelPercent>
                {formatTargetAndHighlight(data.value)}
              </LabelPercent>
            </>
          )}
        </HighlightLabel>
      </FloatingPortal>
    </>
  );
};
