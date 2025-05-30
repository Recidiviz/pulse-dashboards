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

import React from "react";

import ProfileLink from "../components/ProfileLink";
import TopBar from "../components/TopBar/TopBar";
import TopBarLogo from "../components/TopBar/TopBarLogo";

const LanternTopBar: React.FC = () => {
  return (
    <TopBar isWide>
      <TopBarLogo />
      <ul className="nav-right">
        <ProfileLink />
      </ul>
    </TopBar>
  );
};

export default LanternTopBar;
