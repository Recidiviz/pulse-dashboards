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
  autoPlacement,
  autoUpdate,
  FloatingPortal,
  offset,
  Placement,
  shift,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
} from "@floating-ui/react";
import { spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import { useState } from "react";
import styled from "styled-components";

import { palette } from "~design-system";

import { Client } from "../../WorkflowsStore";
import { SentenceProgressPresenter } from "../../WorkflowsStore/presenters/SentenceProgressPresenter";
import { Resident } from "../../WorkflowsStore/Resident";
import { CANVAS_HEIGHT, TIMELINE_HEIGHT } from "./SentenceProgressV2";

const POINT_WIDTH = 4;

const LabelContainer = styled.div`
  ${typography.Sans12}
  border: 1px solid ${palette.slate20};
  border-radius: 4px;
  padding: 6px ${rem(spacing.sm)};
  color: ${palette.pine2};
  pointer-events: none;
  display: flex;
  flex-direction: column;
  line-height: 1.2;
`;

const DateLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
`;

const FormattedDate = styled.div`
  font-size: 11px;
`;

const TimelinePoint = styled.rect``;

export type SentenceProgressPoint = {
  /**
   * The label for the timeline point, e.g. Sentence Start, Parole Review Date.
   */
  label: string;
  date: Date;
  formattedDate: string;
  /**
   * When true, the point label is hidden unless the point is hovered
   */
  hideLabel: boolean;
  /**
   * Fill color for the timeline point.
   */
  pointFill: string;
  /**
   * Sets the label alignment to avoid label overflow at the ends of the timeline.
   */
  labelPlacement: Placement;
  /**
   * The scaled value corresponding to where the point falls on the timeline. Only
   * undefined when the relevant input is not included in the timeline scale domain
   * (should never happen, but typescript is unhappy if this is not an optional field).
   */
  x?: number;
};

// TODO(#11429): Revisit label alignment for edge cases.
function useHoverProps(labelPlacement: Placement) {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      autoPlacement({ allowedPlacements: [labelPlacement] }),
      offset(spacing.sm),
      shift({ padding: spacing.sm }),
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

export const SentenceProgressPointV2 = observer(
  function SentenceProgressPointV2({
    point: {
      label,
      hideLabel: labelHidden,
      x,
      pointFill,
      formattedDate,
      labelPlacement,
    },
    presenter,
  }: {
    point: SentenceProgressPoint;
    presenter: SentenceProgressPresenter<Resident | Client>;
  }) {
    const {
      floatingStyles,
      getReferenceProps,
      getFloatingProps,
      isOpen: isHovered,
      refs,
    } = useHoverProps(labelPlacement);

    // X is only undefined when the relevant date is not including in the timeline
    // domain (this should never happen, but typescript doesn't know that).
    if (x === undefined) {
      return null;
    }

    const { hoveredTimelineDate } = presenter;

    // Hide if labelHidden by default and point is not hovered.
    // Or hide if a different hovered point set on the presenter.
    // TODO(#11429): Revisit hover interactions for start and end dates.
    const hideLabel =
      (labelHidden && !isHovered) ||
      (hoveredTimelineDate && hoveredTimelineDate !== label);

    return (
      <>
        <TimelinePoint
          tabIndex={0}
          x={`${x}%`}
          y={CANVAS_HEIGHT / 2 - TIMELINE_HEIGHT / 2}
          width={POINT_WIDTH}
          height={TIMELINE_HEIGHT}
          fill={pointFill}
          stroke={isHovered ? `${rgba(palette.slate90, 0.1)}` : "transparent"}
          strokeWidth={`${isHovered ? 10 : 0}px`}
          ref={refs.setReference}
          onMouseEnter={() => {
            presenter.hoveredTimelineDate = label;
          }}
          onMouseOut={() => {
            presenter.hoveredTimelineDate = undefined;
          }}
          {...getReferenceProps()}
        />
        <FloatingPortal>
          {!hideLabel && (
            <LabelContainer
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
            >
              <DateLabel>{label}</DateLabel>
              <FormattedDate>{formattedDate}</FormattedDate>
            </LabelContainer>
          )}
        </FloatingPortal>
      </>
    );
  },
);
