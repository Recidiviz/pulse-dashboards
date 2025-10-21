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

import * as React from "react";
import { useRef, useState } from "react";
import styled, { css } from "styled-components/macro";

import { palette } from "../../styles";
import MenubarContext from "./MenubarContext";
import MenubarFocusManager from "./MenubarFocusManager";

const MenuBarElement = styled.nav<{
  vertical?: boolean;
  focusBorderColor?: string;
}>`
  display: flex;
  justify-content: space-between;
  width: 100%;
  ${({ vertical }) =>
    vertical &&
    css`
      flex-direction: column;
      align-items: flex-start;
    `}

  a {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  ${({ focusBorderColor }) => css`
    &:has(:focus-visible) {
      box-shadow:
        -1px 1px 1px 1px ${focusBorderColor || palette.signal.links},
        1px -1px 1px 1px ${focusBorderColor || palette.signal.links};
      border-radius: 4px;
    }

    [role="menuitem"]:focus-visible {
      box-shadow:
        -1px 1px 1px 1px ${focusBorderColor || palette.signal.links},
        1px -1px 1px 1px ${focusBorderColor || palette.signal.links};
      border-radius: 4px;
    }`}
`;

export interface MenubarProps {
  children: JSX.Element | JSX.Element[];
  className?: string;
  vertical?: boolean;
  ariaLabel?: string;
  focusBorderColor?: string;
}

export const Menubar = ({
  children,
  className,
  vertical,
  ariaLabel,
  focusBorderColor,
}: MenubarProps): JSX.Element => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [focusManager] = useState(new MenubarFocusManager(ref));

  React.useEffect(() => {
    // Override tabIndex for all menuitem children so that they are removed from tab order
    if (ref.current) {
      const menuItems = ref.current.querySelectorAll('[role="menuitem"]');
      menuItems.forEach((item) => {
        (item as HTMLElement).tabIndex = -1;
      });
    }
  }, [children]);

  const onFocus: React.FocusEventHandler<HTMLDivElement> = (event) => {
    // If focus moves into the menubar from an outside element, focus the first item.
    // This check prevents focus from being hijacked if a user clicks directly on a menu item.
    if (
      !ref.current?.contains(event.relatedTarget as Node) &&
      ref.current === event.target
    ) {
      focusManager.focusFirstItem();
    }
  };

  const onKeyPress: React.KeyboardEventHandler<HTMLDivElement> = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    switch (event.key) {
      case "Right":
      case "ArrowRight":
        if (!vertical) {
          event.preventDefault();
          focusManager.focusNextItem();
        }
        break;
      case "Left":
      case "ArrowLeft":
        if (!vertical) {
          event.preventDefault();
          focusManager.focusPreviousItem();
        }
        break;
      case "Down":
      case "ArrowDown":
        if (vertical) {
          event.preventDefault();
          focusManager.focusNextItem();
        }
        break;
      case "Up":
      case "ArrowUp":
        if (vertical) {
          event.preventDefault();
          focusManager.focusPreviousItem();
        }
        break;
      default:
        break;
    }
  };

  return (
    <MenuBarElement
      className={className}
      ref={ref}
      onKeyDown={onKeyPress}
      onFocus={onFocus}
      role="menubar"
      tabIndex={0}
      vertical={vertical}
      aria-label={ariaLabel || "Menu Bar"}
      focusBorderColor={focusBorderColor}
    >
      <MenubarContext.Provider value={{ focusManager }}>
        {children}
      </MenubarContext.Provider>
    </MenuBarElement>
  );
};
