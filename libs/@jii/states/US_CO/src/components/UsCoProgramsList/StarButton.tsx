// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { FC } from "react";
import styled from "styled-components";

import { Icon, palette } from "~design-system";

const StyledButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

type StarButtonProps = {
  isStarred: boolean;
  onClick: (e: React.MouseEvent) => void;
  size: number;
};

export const StarButton: FC<StarButtonProps> = ({
  isStarred,
  onClick,
  size,
}) => {
  return (
    <StyledButton type="button" onClick={onClick}>
      <Icon
        kind={isStarred ? "Star" : "StarOutline"}
        role="img"
        size={size}
        color={isStarred ? palette.data.gold1 : palette.slate30}
      />
    </StyledButton>
  );
};
