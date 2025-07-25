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

import Avatar from "boring-avatars";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { useUserStore } from "../../components/StoreProvider";

interface AvatarProps {
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
  overflow: hidden;
  position: relative;
  
  svg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 8px;

  }
`,
);

export const AvatarInitials = styled.div`
  font-size: ${rem(10)};
  letter-spacing: 0.02em;
  color: white;
  text-align: center;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 100%;
  border: 1px solid rgba(${palette.marble1}, 0.1);
  border-radius: 8px;
`;

export const AvatarImage = styled(AvatarInitials)`
  background-size: cover;
  background-position: center;
`;

const UserAvatar: React.FC<AvatarProps> = ({ size = 32 }) => {
  const { user } = useUserStore();
  if (!user) return null;

  if (!user.name) {
    return <img src={user.picture} className="UserAvatar" alt="User icon" />;
  }

  const initials = user.name.split(" ").map((sub) => sub.charAt(0));

  // The autogenerated profile icons with the letter in the middle of a
  // solid field come from gravatar. We want to overwrite them with our
  // own custom letter on a solid field.
  const useBoringAvatars = !user.picture || user.picture?.includes("gravatar");

  if (useBoringAvatars) {
    return (
      <AvatarElement size={size} className="UserAvatar">
        <Avatar
          variant="marble"
          size={size}
          name={user.name}
          colors={palette.data.defaultOrder}
          square
          // @ts-ignore the title prop is missing from the package's types
          title // required for axe compliance
        />

        <AvatarInitials>
          {initials[0]}
          {initials.length > 1 ? initials[initials.length - 1] : ""}
        </AvatarInitials>
      </AvatarElement>
    );
  }

  return (
    <AvatarElement size={size} className="UserAvatar">
      <AvatarImage
        style={{
          backgroundImage: `url("${user.picture}")`,
        }}
      />
    </AvatarElement>
  );
};

export { UserAvatar };
