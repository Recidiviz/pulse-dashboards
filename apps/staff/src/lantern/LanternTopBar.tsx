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

import { observer } from "mobx-react-lite";
import React from "react";
import { NavLink } from "react-router-dom";

import ProfileLink from "../components/ProfileLink";
import { useUserStore } from "../components/StoreProvider";
import TopBar from "../components/TopBar/TopBar";
import TopBarLogo from "../components/TopBar/TopBarLogo";

const LanternTopBar: React.FC = observer(function LanternTopBar() {
  const userStore = useUserStore();
  const hasSARAccess = !!userStore.userAllowedNavigation?.sarAccess;
  const hasTasksAccess =
    !!userStore.userAllowedNavigation?.workflows?.includes("tasks");

  return (
    <TopBar isWide>
      <TopBarLogo />
      <ul className="nav-right">
        {hasTasksAccess && (
          <li>
            <NavLink to="/workflows/tasks">Go to Tasks</NavLink>
          </li>
        )}
        {hasSARAccess && (
          <li>
            <NavLink to="/sarAccess">Go to SAR Dashboard</NavLink>
          </li>
        )}
        <ProfileLink />
      </ul>
    </TopBar>
  );
});

export default LanternTopBar;
