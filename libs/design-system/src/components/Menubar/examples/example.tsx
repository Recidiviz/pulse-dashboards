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

import styled from "styled-components";

import { palette } from "../../../styles";
import { Menubar, type MenubarProps } from "../Menubar";

// the actual menu items you pass as children must have role=menuitem for accessibility;
// this component does not handle that for you since the children could be anything (e.g wrapper divs)
const MenuItem = styled.a.attrs({ role: "menuitem" })`
  padding: 0.5rem 1rem;
  color: ${palette.pine4};
  text-decoration: none;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: ${palette.slate10};
  }
`;

type MenubarRenderArgs = Omit<MenubarProps, "children">;

const render = ({
  vertical,
  ariaLabel,
  focusBorderColor,
  className,
}: MenubarRenderArgs) => (
  <Menubar
    vertical={vertical}
    ariaLabel={ariaLabel}
    focusBorderColor={focusBorderColor}
    className={className}
  >
    <MenuItem href="#">Dashboard</MenuItem>
    <MenuItem href="#">Clients</MenuItem>
    <MenuItem href="#">Reports</MenuItem>
    <MenuItem href="#">Settings</MenuItem>
  </Menubar>
);

export default render;
