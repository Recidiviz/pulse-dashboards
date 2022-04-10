// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import Avatar from "boring-avatars";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

interface AvatarProps {
  name: string;
  size?: number;
}

interface AvatarElementProps {
  size: number;
}

const AvatarElement = styled.div(
  ({ size }: AvatarElementProps) => `
  line-height: ${rem(size)};
  height: ${rem(size)};
  width: ${rem(size)};
  border-radius: ${rem(size / 2)};
  overflow: hidden;
  position: relative;
  
  & svg {
    position: absolute;
    top: 0;
  }
`
);

const AvatarInitials = styled.div`
  font-size: ${rem(10)};
  letter-spacing: 0.02em;
  color: white;
  text-align: center;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
`;

const ClientAvatar: React.FC<AvatarProps> = ({ name, size = 40 }) => {
  const initials = name.split(" ").map((sub) => sub.charAt(0));

  return (
    <AvatarElement size={size}>
      <Avatar
        variant="marble"
        size={size}
        name={name}
        colors={palette.data.defaultOrder}
        square={false}
      />
      <AvatarInitials>
        {initials[0]}
        {initials.length > 1 ? initials[initials.length - 1] : ""}
      </AvatarInitials>
    </AvatarElement>
  );
};

export { ClientAvatar };
