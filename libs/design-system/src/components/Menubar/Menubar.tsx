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
import styled from "styled-components/macro";

import { palette } from "../../styles";
import MenubarContext from "./MenubarContext";
import MenubarFocusManager from "./MenubarFocusManager";

const MenuBarElement = styled.nav`
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
  &:has(:focus-visible) {
    margin: -5px;
    border: 1px solid ${palette.signal.links};
    border-radius: 4px;
  }
`;

export interface MenubarProps {
  children: JSX.Element | JSX.Element[];
  className?: string;
}

export const Menubar = ({ children, className }: MenubarProps): JSX.Element => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [focusManager] = useState(new MenubarFocusManager(ref));
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
    // If focus moves into the menubar from an outside element, focus the first item.
    // This check prevents focus from being hijacked if a user clicks directly on a menu item.
    if (!ref.current?.contains(event.relatedTarget as Node)) {
      focusManager.focusFirstItem();
    }
  };
  return (
    <MenuBarElement
      className={className}
      ref={ref}
      onKeyDown={onKeyPress}
      role="menubar"
      onFocus={onFocus}
      tabIndex={0}
    >
      <MenubarContext.Provider value={{ focusManager }}>
        {children}
      </MenubarContext.Provider>
    </MenuBarElement>
  );
};
