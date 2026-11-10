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

import { borderRadius, palette, spacing } from "../../../styles";
import { BodyS1 } from "../../../styles/typography";

const cardColor = ({ $isActive }: { $isActive: boolean }) =>
  $isActive ? palette.misc.currentStepBlue : palette.background.secondary;

export const Card = styled.div<{ $isActive: boolean }>`
  align-items: flex-start;
  background: ${cardColor};
  border-radius: ${borderRadius[20]};
  border: 3px solid ${cardColor};
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const Content = styled.div`
  background: ${palette.background.primary};
  border-radius: ${borderRadius[18]};
  box-sizing: border-box;
  padding: ${spacing[5]};
  width: 100%;
`;

export const Header = styled.div`
  align-items: center;
  justify-content: flex-start;
  display: flex;
  flex-direction: row;
  padding: ${spacing[2]} ${spacing[3]};
  gap: ${spacing[2]};
`;

export const Dot = styled.span`
  background: ${palette.background.primary};
  border-radius: ${borderRadius.round};
  flex: none;
  height: 6px;
  width: 6px;
`;

export const Label = styled(BodyS1)<{ $isActive: boolean }>`
  color: ${({ $isActive }) =>
    $isActive ? palette.foreground.onBrand : palette.foreground.secondary};
  font-weight: 500;
  text-transform: uppercase;
`;
