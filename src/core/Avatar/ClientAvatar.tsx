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
import { palette, Sans14 } from "@recidiviz/design-system";
import Avatar from "boring-avatars";
import { rem } from "polished";
import React from "react";
import styled, { css } from "styled-components/macro";

interface AvatarProps {
  name: string;
  size?: number;
  splitName?: boolean;
}

interface AvatarElementProps {
  size: number;
}

const AvatarElement = styled.div(
  ({ size }: AvatarElementProps) => css`
    align-items: center;
    border-radius: ${rem(size / 2)};
    display: flex;
    height: ${rem(size)};
    line-height: ${rem(size)};
    justify-content: center;
    overflow: hidden;
    position: relative;
    width: ${rem(size)};

    & svg {
      left: 0;
      position: absolute;
    }
  `
);

const AvatarInitials = styled(Sans14)<{ size: number }>`
  color: white;
  flex: 0 0 auto;
  font-size: ${(props) => rem(props.size / 4)};
  font-weight: 700;
  line-height: 1;
  position: relative;
  text-align: center;
`;

const formatAvatarText = (text: string, splitName: boolean): string => {
  if (!text) return "";
  return splitName
    ? text
        .split(" ")
        .map((sub) => sub.charAt(0))
        .slice(0, 2)
        .join("")
    : text;
};

const ClientAvatar: React.FC<AvatarProps> = ({
  name,
  size = 40,
  splitName = true,
}) => {
  const initials = formatAvatarText(name, splitName);

  return (
    <AvatarElement size={size}>
      <Avatar
        variant="marble"
        size={size}
        name={name}
        colors={palette.data.defaultOrder}
        square={false}
      />
      <AvatarInitials size={size}>{initials}</AvatarInitials>
    </AvatarElement>
  );
};

export { ClientAvatar };
