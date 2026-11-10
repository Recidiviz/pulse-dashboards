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
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import React, { useState } from "react";

import * as Styled from "./Tooltip.styles";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

// Bubble is portaled to body, so scroll containers can't clip it.
export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "top",
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context),
    useFocus(context),
    useDismiss(context),
    useRole(context, { role: "tooltip" }),
  ]);

  return (
    <>
      <Styled.Trigger
        ref={refs.setReference}
        tabIndex={0}
        {...getReferenceProps()}
      >
        {children}
      </Styled.Trigger>
      {open ? (
        <FloatingPortal>
          <Styled.Bubble
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            <Styled.Text>{content}</Styled.Text>
          </Styled.Bubble>
        </FloatingPortal>
      ) : null}
    </>
  );
};
