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

import { palette } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";

import { PersonInitialsAvatar } from "~ui";

import {
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
} from "../Dropdown/Dropdown";
import { useRootStore } from "../StoreProvider/useRootStore";

export const AccountMenu = observer(function AccountMenu() {
  const { userStore } = useRootStore();

  // we should always have this once login is successful and processed
  if (!userStore.user) return null;

  return (
    <Dropdown>
      <DropdownToggle kind="borderless">
        <PersonInitialsAvatar
          name={userStore.user.name ?? "User"}
          size={32}
          square
          solidColor={palette.pine4}
        />
      </DropdownToggle>
      <DropdownMenu alignment="right">
        <DropdownMenuItem onClick={() => userStore.logOut()}>
          Log out
        </DropdownMenuItem>
      </DropdownMenu>
    </Dropdown>
  );
});
