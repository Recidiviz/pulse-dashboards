// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { typography } from "@recidiviz/design-system";
import * as React from "react";
import { useRef, useState } from "react";
import styled from "styled-components/macro";

import { palette } from "../../styles";
import ToolbarContext from "./ToolbarContext";
import ToolbarFocusManager from "./ToolbarFocusManager";

const ToolbarElement = styled.nav`
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 100%;

  a {
    display: flex;
    justify-content: center;
    align-items: center;
    ${typography.Sans14}
  }

  &.FocusVisible {
    box-shadow:
      -1px 1px 1px 1px ${palette.signal.links},
      1px -1px 1px 1px ${palette.signal.links};
    border-radius: 4px;

    .ToolbarItem {
      &:has(:focus-visible) {
        box-shadow:
          -1px 1px 1px 1px ${palette.signal.links},
          1px -1px 1px 1px ${palette.signal.links};
        border-radius: 4px;
      }
    }
  }
`;

export interface ToolbarProps {
  children: JSX.Element | JSX.Element[];
  className?: string;
  ariaLabel?: string;
}

export const Toolbar = ({
  children,
  className,
  ariaLabel,
}: ToolbarProps): JSX.Element => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [focusManager] = useState(new ToolbarFocusManager(ref));
  const onKeyPress: React.KeyboardEventHandler<HTMLDivElement> = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    switch (event.key) {
      case "Right":
      case "ArrowRight":
        event.preventDefault();
        focusManager.focusNextItem();
        break;
      case "Left":
      case "ArrowLeft":
        event.preventDefault();
        focusManager.focusPreviousItem();
        break;
      default:
        break;
    }
  };

  const onFocus: React.FocusEventHandler<HTMLDivElement> = (event) => {
    // If focus moves into the toolbar from an outside element, focus the first item.
    if (!ref.current?.contains(event.relatedTarget as Node)) {
      focusManager.focusFirstItem();
      ref.current?.classList.add('FocusVisible');
    }
  };

  React.useEffect(() => {
    // Override tabIndex for all focusable children so that they are removed from tab order
    if (ref.current) {
      const focusableElements = ref.current.querySelectorAll(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]',
      );
      focusableElements.forEach((item) => {
        (item as HTMLElement).tabIndex = -1;
      });
    }
  }, [children]);

  React.useEffect(() => {
    const removeFocusVisible = (event: MouseEvent) => {
      // Only remove FocusVisible on actual mouse clicks, not keyboard-triggered clicks
      if (ref.current && event.isTrusted && event.detail > 0) {
        ref.current.classList.remove("FocusVisible");
      }
    };

    const conditionallyRemoveFocusVisible = (event: FocusEvent) => {
      const relatedTarget = event.relatedTarget as HTMLElement;
      if (ref.current && relatedTarget) {
        // Check if the newly focused element is inside of the Toolbar, if not remove FocusVisible
        if (!ref.current.contains(relatedTarget as Node)) {
          ref.current.classList.remove('FocusVisible');
        }
      }
    };

    document.addEventListener("click", removeFocusVisible);
    document.addEventListener("focusout", conditionallyRemoveFocusVisible);

    return () => {
      document.removeEventListener("click", removeFocusVisible);
      document.removeEventListener("focusout", conditionallyRemoveFocusVisible);
    };
  }, []);

  return (
    <ToolbarElement
      className={className || ""}
      ref={ref}
      onKeyDown={onKeyPress}
      role="toolbar"
      tabIndex={0}
      onFocus={onFocus}
      aria-label={ariaLabel}
      onMouseDown={(e) => {
        // prevents a blur from clobbering click event in Safari
        // https://stackoverflow.com/questions/17769005/onclick-and-onblur-ordering-issue/57630197#57630197
        e.preventDefault();
      }}
    >
      <ToolbarContext.Provider value={{ focusManager }}>
        {children}
      </ToolbarContext.Provider>
    </ToolbarElement>
  );
};
