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

import "./UserAvatar.scss";

import { observer } from "mobx-react-lite";
import React from "react";
import { Link } from "react-router-dom";

import { useUserStore } from "../StoreProvider";

interface Props {
  pathways?: boolean;
}

const UserAvatar: React.FC<Props> = ({ pathways = false }) => {
  const { user } = useUserStore();
  return (
    <Link to={pathways ? "/pathways-profile" : "/profile"}>
      <span className="UserAvatar">{user.name && user.name[0]}</span>
    </Link>
  );
};

export default observer(UserAvatar);
