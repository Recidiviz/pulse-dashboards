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

// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
import { useContext, useEffect, useRef } from "react";
import * as React from "react";

import { MenuItemElement } from "./Dropdown.styles";
import DropdownContext from "./DropdownContext";

// Base props shared by all variants
interface DropdownMenuItemBaseProps {
  className?: string;
  /**
   * @deprecated pass children instead
   */
  label?: string;
  children: React.ReactNode;
  preventCloseOnClickEvent?: boolean;
}

// Props for when the item's action is a link inside the children
interface LinkMenuItemProps extends DropdownMenuItemBaseProps {
  onClick?: never;
}

// Props for when the item's action is an onClick handler
interface ActionMenuItemProps extends DropdownMenuItemBaseProps {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}

export type DropdownMenuItemProps = LinkMenuItemProps | ActionMenuItemProps;

export const DropdownMenuItem = ({
  className,
  label,
  children,
  onClick,
  preventCloseOnClickEvent,
}: DropdownMenuItemProps): JSX.Element => {
  const { focusManager, shown, setShown } = useContext(DropdownContext);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    focusManager.focusFirstItem();
  }, [shown, focusManager]);

  const onMouseEnter = (event: React.MouseEvent<HTMLButtonElement>) => {
    ref.current?.focus();
  };

  const handleClick = (
    event:
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    // If a custom onClick is provided, execute it.
    if (onClick) {
      onClick(event as React.MouseEvent<HTMLButtonElement>);
    } else {
      // Otherwise, find an anchor tag in the children and click it.
      const link = ref.current?.querySelector("a");
      if (link) {
        link.click();
      }
    }

    // Close the dropdown and return focus to the toggle button.
    if (!preventCloseOnClickEvent) {
      setShown(false);
      focusManager.focusToggle();
    }
  };

  const isLink = !onClick;

  return (
    <MenuItemElement
      className={className}
      ref={ref}
      isLink={isLink}
      onMouseDown={(e) =>
        // prevents a blur from clobbering click event in Safari
        // https://stackoverflow.com/questions/17769005/onclick-and-onblur-ordering-issue/57630197#57630197
        e.preventDefault()
      }
      onMouseEnter={onMouseEnter}
      onClick={handleClick}
      disabled={!shown}
      role="menuitem"
    >
      {label || children}
    </MenuItemElement>
  );
};
