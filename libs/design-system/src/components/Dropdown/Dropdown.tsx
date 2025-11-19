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
import { type JSX, useRef, useState } from "react";

import { DropdownElement } from "./Dropdown.styles";
import DropdownContext from "./DropdownContext";
import DropdownFocusManager from "./DropdownFocusManager";

export interface DropdownProps {
  children: JSX.Element | JSX.Element[];
  className?: string;
  id?: string;
}

export const Dropdown = ({
  children,
  className,
  id,
}: DropdownProps): JSX.Element => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [focusManager] = useState(new DropdownFocusManager(ref));
  const [shown, setShown] = useState(false);

  React.useEffect(() => {
    // Override tabIndex for all menuitem children
    if (ref.current) {
      const menuItems = ref.current.querySelectorAll('[role="menuitem"]');
      menuItems.forEach((item) => {
        (item as HTMLElement).tabIndex = -1;
      });
    }
  }, [children]);

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    switch (event.key) {
      case "Down":
      case "ArrowDown":
        if (shown) {
          event.preventDefault();
          focusManager.focusNextItem();
          break;
        } else {
          event.preventDefault();
          setShown(true);
          focusManager.focusFirstItem();
          break;
        }
      case "Up":
      case "ArrowUp":
        event.preventDefault();
        focusManager.focusPreviousItem();
        break;
      case "Left":
      case "ArrowLeft":
      case "Right":
      case "ArrowRight":
        setShown(false);
        break;
      case "Esc":
      case "Escape":
        event.stopPropagation();
        event.preventDefault();
        setShown(false);
        focusManager.focusToggle();
        break;
      default:
        break;
    }
  };

  React.useEffect(() => {
    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (!focusManager.dropdown?.current?.contains(target)) {
        setShown(false);
      }
    };

    document.addEventListener("click", handleFocus);
    document.addEventListener("focusin", handleFocus);

    return () => {
      document.removeEventListener("click", handleFocus);
      document.removeEventListener("focusin", handleFocus);
    };
  });

  return (
    <DropdownElement
      className={className}
      ref={ref}
      onKeyDown={onKeyDown}
      id={id}
    >
      <DropdownContext.Provider value={{ focusManager, shown, setShown }}>
        {children}
      </DropdownContext.Provider>
    </DropdownElement>
  );
};
