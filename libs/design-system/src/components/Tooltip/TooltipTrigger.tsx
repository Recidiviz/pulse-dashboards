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

import React, { useRef, useState } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";

import { Tooltip } from "./Tooltip";

type TooltipTriggerProps = {
  children: React.ReactElement;
  className?: string;
  contents: React.ReactNode;
  maxWidth?: number;
  backgroundColor?: string;

  // if positionX or positionY are provided, it will
  // override the autopositioning for that axis
  positionX?: "right" | "left";
  positionY?: "top" | "bottom";
};

// if the child is not perfectly rectangular (e.g. has rounded corners),
// this ensures only the child's footprint will be hoverable and not the space around it
const HoverTarget = styled.span`
  pointer-events: none;

  & > * {
    pointer-events: auto;
  }
`;

// only makes a tooltip visible on hover if contents are actually provided
function useTooltipState(contents: TooltipTriggerProps["contents"]) {
  const haveValidContents = Boolean(contents);
  const [showTooltip, setShowTooltip] = useState(false);
  const setShowTooltipIfValid = (hoverState: boolean) => {
    setShowTooltip(haveValidContents && hoverState);
  };

  return [showTooltip, setShowTooltipIfValid] as const;
}

/**
 * Wraps a component that should display a tooltip on hover.
 * `children` must render an element (not just text)
 * so we can properly target it with pointer events.
 */
export const TooltipTrigger: React.FC<TooltipTriggerProps> = ({
  children,
  className,
  contents,
  maxWidth,
  backgroundColor,
  positionX,
  positionY,
}: TooltipTriggerProps) => {
  const [offset, setOffset] = useState({ top: "0px", left: "0px" });
  const [showTooltip, setShowTooltip] = useTooltipState(contents);
  const tooltipRef = useRef<HTMLDivElement>(null);

  let frame: number;
  const pointerOffset = 15;
  const updateTooltipPosition = (x: number, y: number) => {
    if (typeof frame !== "undefined") {
      window.cancelAnimationFrame(frame);
    }

    let offsetLeft = x;
    let offsetTop = y;
    let offsetWidth = 0;
    let offsetHeight = 0;

    if (tooltipRef.current) {
      offsetWidth = tooltipRef.current.offsetWidth;
      offsetHeight = tooltipRef.current.offsetHeight;

      if (maxWidth) offsetWidth = maxWidth;
      if (offsetWidth > 300) offsetWidth = 300;
    }

    // if tooltip doesn't have enough space on the right move it to the left relative to pointer.
    if (
      (offsetWidth &&
        window.innerWidth - x < offsetWidth &&
        x - offsetWidth > pointerOffset) ||
      positionX === "left"
    ) {
      offsetLeft = x - offsetWidth - (pointerOffset + 5);
    }

    // If tooltip doesn't have enough space on the bottom move it to the top right of the pointer.
    if (
      (offsetHeight && offsetHeight + y > window.innerHeight) ||
      positionY === "top"
    ) {
      offsetTop = y - offsetHeight - 15;
    }

    frame = window.requestAnimationFrame(() => {
      setOffset({
        left: `${offsetLeft}px`,
        top: `${offsetTop}px`,
      });
    });
  };

  const onMouseMove: React.MouseEventHandler<HTMLDivElement> = (event) => {
    updateTooltipPosition(
      event.clientX + pointerOffset,
      event.clientY + pointerOffset,
    );
  };

  const onMouseEnter: React.MouseEventHandler<HTMLDivElement> = (event) => {
    setShowTooltip(true);
    updateTooltipPosition(
      event.clientX + pointerOffset,
      event.clientY + pointerOffset,
    );
  };

  const onMouseLeave = () => {
    setShowTooltip(false);
  };

  const onFocus: React.FocusEventHandler<HTMLSpanElement> = (event) => {
    // if someone clicked on a hovered item don't override mouse position
    if (!showTooltip) {
      const bounds = event.target.getBoundingClientRect();
      updateTooltipPosition(bounds.right + pointerOffset, bounds.top);
    }
    setShowTooltip(true);
  };

  return (
    <>
      {showTooltip &&
        ReactDOM.createPortal(
          <Tooltip
            ref={tooltipRef}
            maxWidth={maxWidth}
            backgroundColor={backgroundColor}
            style={{
              top: offset.top,
              left: offset.left,
            }}
          >
            {contents}
          </Tooltip>,
          window.document.body,
        )}

      <HoverTarget
        className={className}
        onMouseMove={onMouseMove}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
        onBlur={onMouseLeave}
      >
        {children}
      </HoverTarget>
    </>
  );
};
