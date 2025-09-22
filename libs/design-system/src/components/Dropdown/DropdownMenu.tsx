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
import { KeyboardEventHandler, useContext } from "react";

import { MenuElement } from "./Dropdown.styles";
import DropdownContext from "./DropdownContext";

export interface DropdownMenuProps {
  alignment?: "left" | "right";
  className?: string;
  children?: React.ReactNode;
}

export const DropdownMenu = ({
  alignment,
  className,
  children,
}: DropdownMenuProps): JSX.Element => {
  const { focusManager, shown, setShown } = useContext(DropdownContext);
  const onKeyPress: KeyboardEventHandler<HTMLDivElement> = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    switch (event.key) {
      case "Down":
      case "ArrowDown":
        event.preventDefault();
        focusManager.focusNextItem();
        break;
      case "Up":
      case "ArrowUp":
        event.preventDefault();
        focusManager.focusPreviousItem();
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
    <MenuElement
      alignment={alignment}
      className={className}
      onKeyDown={onKeyPress}
      shown={shown}
    >
      {children}
    </MenuElement>
  );
};
