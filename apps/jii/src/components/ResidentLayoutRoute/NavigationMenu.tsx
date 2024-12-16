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
  Icon,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { FC } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components/macro";

import { NavigationMenuPresenter } from "./NavigationMenuPresenter";

const StyledMenuItem = styled(DropdownMenuItem)`
  ${typography.Sans14}

  height: 3em;
  padding: 0 1.5em;
`;

export const NavigationMenu: FC<{ presenter: NavigationMenuPresenter }> =
  observer(function NavigationMenu({ presenter }) {
    const navigate = useNavigate();
    return (
      <nav>
        <Dropdown>
          <DropdownToggle kind="borderless">
            {/* TODO(https://github.com/Recidiviz/web-libraries/issues/188): accessibility workaround */}
            <Icon
              kind="Hamburger"
              size={16}
              aria-label="Toggle menu"
              role="img"
            />
          </DropdownToggle>
          <DropdownMenu alignment="right">
            <>
              {presenter.links.map((link) => (
                <StyledMenuItem
                  key={link.url}
                  onClick={() => navigate(link.url)}
                >
                  {link.text}
                </StyledMenuItem>
              ))}
            </>
          </DropdownMenu>
        </Dropdown>
      </nav>
    );
  });
