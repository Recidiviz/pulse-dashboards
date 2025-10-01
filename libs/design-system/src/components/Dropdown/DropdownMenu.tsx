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
import { useContext } from "react";

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
  const { shown } = useContext(DropdownContext);

  return (
    <MenuElement alignment={alignment} className={className} shown={shown}>
      {children}
    </MenuElement>
  );
};
