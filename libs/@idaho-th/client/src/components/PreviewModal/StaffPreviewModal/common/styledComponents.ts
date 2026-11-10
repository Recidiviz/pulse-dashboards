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

import styled from "styled-components";

import {
  BodyM2,
  BodyS1,
  borderRadius,
  palette,
  spacing,
} from "../../../../styles";
import { buttonOutline } from "../../../common/StyledComponents";

export const NameRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${spacing[1]};
`;

export const ProviderCardWrapper = styled.div`
  align-items: center;
  background: ${palette.background.primary};
  border-radius: ${borderRadius[20]};
  border: 0.0625rem solid ${palette.misc.subtleAlpha};
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex: none;
  gap: ${spacing[3]};
  justify-content: space-between;
  min-height: 7rem;
  padding: ${spacing[4]};
  width: 100%;
`;

export const CardLeftSection = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: ${spacing[2]};
  justify-content: center;
  min-width: 0;
`;

export const CardRightSection = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  flex: none;
  gap: ${spacing[2]};
  justify-content: center;
`;

export const ProviderName = styled(BodyM2)`
  align-self: stretch;
  color: ${palette.foreground.primary};
`;

export const TrashButton = styled.button`
  ${buttonOutline}
  align-items: center;
  background: ${palette.background.secondary};
  border-radius: ${borderRadius.round};
  cursor: pointer;
  display: flex;
  flex: none;
  gap: ${spacing[1]};
  height: 32px;
  justify-content: center;
  padding-bottom: ${spacing[2]};
  padding-top: ${spacing[2]};
  width: 32px;
  &:hover {
    opacity: 0.85;
  }
`;

export const ProviderDescription = styled(BodyS1)`
  align-self: stretch;
  color: ${palette.foreground.secondary};
`;
