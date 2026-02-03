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
  shift,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
} from "@floating-ui/react";
import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { useState } from "react";
import styled from "styled-components";

import { palette } from "~design-system";

export type ProgressGap = {
  label: string;
  x?: number;
};

const LabelContainer = styled.div`
  font-family: "Public Sans", sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: -0.01em;
  border: 1px solid ${palette.slate20};
  border-radius: 2px;
  padding: ${rem(spacing.xs)};
  color: ${palette.pine2};
  pointer-events: none;
  line-height: 1.2;
`;

const EllipsesWrapper = styled.svg`
  overflow: visible;
`;
const EllipsisDot = styled.circle`
  fill: ${palette.slate80};
  r: ${rem(2)};
`;

function useHoverProps() {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      autoPlacement({ allowedPlacements: ["top"] }),
      offset(spacing.xs),
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

/**
 * Renders an ellipsis at the midpoint of the timeline segment corresponding to the
 * given timeline "gap", i.e. a period of time between relevant date >7 years. When
 * hovered, displays the range of time being visually condensed, e.g. "2026-2048".
 */
export const SentenceProgressGap = function SentenceProgressGap({
  gap: { x, label },
}: {
  gap: ProgressGap;
}) {
  const {
    floatingStyles,
    getReferenceProps,
    getFloatingProps,
    isOpen: isHovered,
    refs,
  } = useHoverProps();
  if (x === undefined) {
    return null;
  }

  return (
    <>
      <EllipsesWrapper
        tabIndex={0}
        x={`${x}%`}
        y={"50%"}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        {isHovered && (
          <rect
            x="-10"
            y="-8"
            width="30"
            height="16"
            fill="#2B5469"
            fill-opacity="0.1"
          />
        )}
        <EllipsisDot />
        <EllipsisDot cx="5" />
        <EllipsisDot cx="10" />
      </EllipsesWrapper>
      <FloatingPortal>
        {isHovered && (
          <LabelContainer
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            {label}
          </LabelContainer>
        )}
      </FloatingPortal>
    </>
  );
};
