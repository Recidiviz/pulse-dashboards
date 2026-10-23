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
  arrow,
  autoUpdate,
  flip,
  FloatingArrow,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { ReactNode, useId, useRef, useState } from "react";

import { Icon, palette, spacing } from "~design-system";

import { CloseButton, Heading, Surface, TriggerButton } from "./Popover.styles";

const ARROW_WIDTH = 12;
const ARROW_HEIGHT = 7;

type PopoverProps = {
  trigger: ReactNode;
  heading: ReactNode;
  closeLabel: string;
  children: ReactNode;
};

/**
 * A button that opens a small dialog beside it. Tapping outside the dialog,
 * pressing Escape, or tapping its close button closes it and returns focus to
 * the button.
 */
export const Popover = ({
  trigger,
  heading,
  closeLabel,
  children,
}: PopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const headingId = useId();
  const arrowRef = useRef<SVGSVGElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "bottom-end",
    middleware: [
      // Leaves room for the arrow between the trigger and the dialog.
      offset(ARROW_HEIGHT),
      // Opens above the trigger when there isn't room below it.
      flip(),
      // Keeps the dialog at least 16px from the screen edges.
      shift({ padding: spacing.md }),
      arrow({ element: arrowRef }),
    ],
    // Repositions the dialog on scroll and resize while it's open.
    whileElementsMounted: autoUpdate,
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context),
    useRole(context, { role: "dialog" }),
  ]);

  return (
    <>
      <TriggerButton
        type="button"
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        {trigger}
      </TriggerButton>

      {isOpen && (
        <FloatingPortal>
          {/* Moves focus to the heading on open, so a tap doesn't put a focus
              ring on the close button and screen readers start at the title.
              Returns focus to the trigger on close. */}
          <FloatingFocusManager context={context} initialFocus={headingRef}>
            <Surface
              ref={refs.setFloating}
              style={floatingStyles}
              aria-labelledby={headingId}
              {...getFloatingProps()}
            >
              <FloatingArrow
                ref={arrowRef}
                context={context}
                width={ARROW_WIDTH}
                height={ARROW_HEIGHT}
                fill={palette.marble1}
                stroke={palette.slate20}
                strokeWidth={1}
              />
              <Heading id={headingId} ref={headingRef} tabIndex={-1}>
                {heading}
              </Heading>
              <CloseButton
                type="button"
                aria-label={closeLabel}
                onClick={() => setIsOpen(false)}
              >
                <Icon kind="Close" size={12} />
              </CloseButton>
              {children}
            </Surface>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
};
