/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2021 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */

import React, { FC } from "react";
import { Link } from "react-router-dom";

import UserAvatar from "./UserAvatar";

type ProfileLinkProps = {
  pathways?: boolean;
};

const ProfileLink: FC<ProfileLinkProps> = ({
  pathways = false,
}): React.ReactElement => {
  return (
    <Link
      to={pathways ? "/pathways-profile" : "/profile"}
      className="ProfileLink"
    >
      <UserAvatar />
    </Link>
  );
};

export default ProfileLink;
