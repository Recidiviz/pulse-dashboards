// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
} from "@recidiviz/design-system";
import { FC } from "react";
import { useNavigate } from "react-router-dom";

import { NavigationMenuPresenter } from "./NavigationMenuPresenter";

export const NavigationMenu: FC<{ presenter: NavigationMenuPresenter }> = ({
  presenter,
}) => {
  const navigate = useNavigate();
  return (
    <nav>
      <Dropdown>
        <DropdownToggle icon="Hamburger" iconSize={16} kind="borderless" />
        <DropdownMenu alignment="right">
          <>
            {presenter.links.map((link) => (
              <DropdownMenuItem
                key={link.url}
                onClick={() => navigate(link.url)}
              >
                {link.text}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={() => presenter.logout()}>
              Log out
            </DropdownMenuItem>
          </>
        </DropdownMenu>
      </Dropdown>
    </nav>
  );
};