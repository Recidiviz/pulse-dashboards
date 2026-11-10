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
} from "../../../styles";

export const CardRoot = styled.div`
  align-items: center;
  background: ${palette.background.primary};
  border-radius: ${borderRadius[20]};
  border: 0.0625rem solid ${palette.border.subtle};
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  gap: ${spacing[3]};
  min-height: 7rem;
  padding: ${spacing[4]};
  width: 100%;
`;

export const CardLeading = styled.div`
  align-items: flex-start;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${spacing[2]};
  justify-content: center;
  min-width: 0;
`;

export const CardTrailing = styled.div`
  align-items: center;
  display: flex;
  flex: none;
  flex-direction: row;
  gap: ${spacing[2]};
  justify-content: center;
`;

export const CardNameRow = styled.div`
  align-items: center;
  align-self: stretch;
  display: flex;
  flex-direction: row;
  gap: ${spacing[1]};
`;

export const CardName = styled(BodyM2)`
  color: ${palette.foreground.primary};
`;

export const CardDescription = styled(BodyS1)`
  align-self: stretch;
  color: ${palette.foreground.secondary};
`;

export const CardPreferredBadge = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  flex: none;
  gap: ${spacing[1]};

  & svg {
    flex-shrink: 0;
    height: 1rem;
    width: 1rem;
  }
`;

export const CardPreferredText = styled(BodyS1)`
  color: ${palette.misc.lapisLazuli};
`;
