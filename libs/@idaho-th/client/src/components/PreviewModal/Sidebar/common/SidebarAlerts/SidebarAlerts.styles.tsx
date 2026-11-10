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

import { buttonOutline } from "~@idaho-th/client/components/common/StyledComponents";
import {
  BodyS2,
  borderRadius,
  palette,
  spacing,
} from "~@idaho-th/client/styles";

export const Banner = styled.div`
  align-items: center;
  align-self: stretch;
  background: ${palette.background.brandLight};
  border-radius: ${borderRadius[12]};
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
  padding: ${spacing[3]};
  width: 100%;
`;

export const Dot = styled.span`
  background-color: ${palette.foreground.brand};
  border-radius: 50%;
  flex: none;
  height: 0.3125rem;
  width: 0.3125rem;
`;

export const Text = styled(BodyS2)`
  color: ${palette.foreground.brand};
  flex: 1;
`;

export const DismissButton = styled.button`
  ${buttonOutline}
  align-items: center;
  background: none;
  border: none;
  color: ${palette.foreground.brand};
  cursor: pointer;
  display: flex;
  flex: none;
  height: 1rem;
  padding: 0;
  width: 1rem;

  & > svg {
    height: 100%;
    width: 100%;
  }
`;
