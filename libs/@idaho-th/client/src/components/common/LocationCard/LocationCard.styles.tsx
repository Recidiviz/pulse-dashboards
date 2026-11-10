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
  BodyM1,
  BodyS1,
  borderRadius,
  palette,
  spacing,
} from "../../../styles";

export const Card = styled.div`
  border: 0.0625rem solid ${palette.border.subtle};
  border-radius: ${borderRadius[20]};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: none;
  gap: ${spacing[2]};
  padding: ${spacing[4]};
  width: 100%;
`;

export const Head = styled.div<{ $alignTop?: boolean }>`
  align-items: ${({ $alignTop }) => ($alignTop ? "flex-start" : "center")};
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
  justify-content: space-between;
  width: 100%;
`;

// Providers see the address stacked, leaving room alongside for the edit
// control.
export const AddressStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[0.5]};
  min-width: 0;
`;

export const HeaderControls = styled.div`
  align-items: center;
  display: flex;
  flex: none;
  gap: ${spacing[1]};
`;

export const EditFields = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: ${spacing[2]};
  min-width: 0;
`;

export const EditFieldRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
`;

export const EditField = styled.div`
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-width: 0;
`;

export const StreetAddress = styled(BodyM1)`
  color: ${palette.foreground.primary};
`;

export const CityStateZip = styled(BodyS1)`
  color: ${palette.foreground.secondary};
`;

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[1]};
  width: 100%;
`;

export const Row = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
  justify-content: space-between;
  width: 100%;
`;

export const RowLabel = styled(BodyS1)`
  color: ${palette.foreground.secondary};
  flex: 1 1 auto;
  min-width: 0;
`;

export const RowValue = styled(BodyS1)<{ $positive: boolean }>`
  color: ${({ $positive }) =>
    $positive ? palette.foreground.success : palette.foreground.attention};
`;

// Fixed width so every edit-mode dropdown matches regardless of label length;
// the label absorbs the leftover space.
export const RowValueField = styled.div`
  flex: 0 0 10rem;
  width: 10rem;
`;
