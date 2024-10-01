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
import { observer } from "mobx-react-lite";
import { ReactNode, useEffect, useState } from "react";
import { Link, LinkProps, matchPath, useLocation } from "react-router-dom";

import {
  HIGHLIGHT_MARK_STROKE_WIDTH,
  HIGHLIGHTED_DOT_COLOR_V2,
  SWARM_DOT_RADIUS_V2,
  SWARM_SIZE_BREAKPOINT,
} from "../../InsightsStore/presenters/SwarmPresenter/constants";
import { HighlightedDot } from "../../InsightsStore/presenters/SwarmPresenter/types";
import { PresenterWithHoverManager } from "../../InsightsStore/presenters/types";
import { getRelativePath, insightsRoute, insightsUrl } from "../views";
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
  presenter?: PresenterWithHoverManager;
};

function useHoverProps(
  hoveredOfficerId: string | undefined,
  officerId: string,
) {
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

  useEffect(() => {
    setIsOpen(hoveredOfficerId === officerId);
  }, [hoveredOfficerId, officerId]);

  return {
    isOpen,
    setIsOpen,
    refs,
    floatingStyles,
    getReferenceProps,
    getFloatingProps,
  };
}
/**
 * Wraps given children component(s) in Link if the condition is true.
 * @returns Given children component wrapped in Link component if condition is met. Otherwise, only returns children.
 */
const ConditionalLinkWrapper: React.FC<
  LinkProps & {
    children: ReactNode;
    condition: boolean;
  }
> = ({ children, condition, ...linkProps }) => {
  return condition ? <Link {...linkProps}>{children}</Link> : <>{children}</>;
};

export const SwarmPlotHighlightedDot = observer(
  function SwarmPlotHighlightedDot({
    data,
    r,
    cx,
    cy,
    plotWidth,
    isHoverable,
    presenter,
  }: HighlightedPointProps) {
    const {
      floatingStyles,
      getReferenceProps,
      getFloatingProps,
      isOpen,
      refs,
    } = useHoverProps(presenter?.hoveredOfficerId, data.officerId);

    const showLabel = !data.labelHidden && isHoverable;
    const isHovered = showLabel && isOpen;

    const currRelativePath = getRelativePath(useLocation().pathname);
    const isSupervisorPage = matchPath(
      insightsRoute({ routeName: "supervisionSupervisor" }),
      currRelativePath,
    );

    return (
      <>
        <ConditionalLinkWrapper
          condition={!!isSupervisorPage}
          to={insightsUrl("supervisionStaffMetric", {
            officerPseudoId: data.officerPseudoId,
            metricId: data.metricId,
          })}
        >
          <RateHighlightMark
            onMouseEnter={() => {
              if (isSupervisorPage && presenter)
                presenter.updateHoveredOfficerId(data.officerId);
            }}
            onMouseOut={() => {
              if (isSupervisorPage && presenter)
                presenter.updateHoveredOfficerId(undefined);
            }}
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
        </ConditionalLinkWrapper>
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
  },
);
