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
  Heading5,
  palette,
  spacing,
} from "../../../../../styles";
import ArrowDownSvg from "../../../../assets/arrow-down.svg?react";
import { buttonOutline } from "../../../../common/StyledComponents";

export const DetailRoot = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

export const DetailHeader = styled.div`
  align-items: flex-start;
  background: ${palette.background.primary};
  border-bottom: 1px solid ${palette.misc.subtleAlpha};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 74px;
  padding: ${spacing[4]};
  width: 100%;
`;

export const HeaderContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${spacing[3]};
  width: 100%;
`;

export const BackButton = styled.button`
  ${buttonOutline}
  align-items: center;
  background: transparent;
  cursor: pointer;
  display: flex;
  flex: none;
  height: 1rem;
  justify-content: center;
  padding: 0;
  width: 1rem;
`;

export const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

export const Title = styled(Heading5)`
  color: ${palette.foreground.primary};
`;

export const DetailContent = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: ${spacing[5]};
  overflow-y: auto;
  overscroll-behavior-y: contain;
  padding: ${spacing[4]};
  scrollbar-gutter: stable;
  width: 100%;
`;

export const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[3]};
  width: 100%;
`;

export const InfoItem = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${spacing[3]};
  width: 100%;
`;

export const InfoItemLeft = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  flex: 1;
  gap: ${spacing[2]};
`;

export const InfoIcon = styled.div`
  align-items: center;
  display: flex;
  flex: none;
  height: 1.25rem;
  justify-content: center;
  width: 1.25rem;

  svg {
    height: 100%;
    width: 100%;
  }
`;

export const UserIconWrapper = styled.span`
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  width: 100%;

  svg path {
    fill: ${palette.foreground.tertiary};
  }
`;

export const InfoLabel = styled(BodyS1)`
  color: ${palette.foreground.secondary};
`;

export const InfoValue = styled(BodyS1)`
  color: ${palette.foreground.primary};
`;

export const ButtonWrapper = styled.div`
  align-self: flex-start;
`;

export const Divider = styled.div`
  background: ${palette.misc.subtleAlpha};
  flex-shrink: 0;
  height: 1px;
  width: 100%;
`;

export const ArrowDown = styled(ArrowDownSvg)`
  display: block;
  height: 0.375rem;
  width: 0.6669rem;
`;

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const LocationsSectionHeader = styled.button`
  ${buttonOutline}
  align-items: center;
  background: transparent;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 0;
  width: 100%;
`;

export const LocationsSectionTitle = styled(BodyM1)`
  color: ${palette.foreground.primary};
`;

export const ChevronIcon = styled.span<{ $open: boolean }>`
  align-items: center;
  color: ${palette.foreground.tertiary};
  display: flex;
  flex: none;
  height: 1rem;
  justify-content: center;
  transform: ${({ $open }) => ($open ? "rotate(180deg)" : "rotate(0deg)")};
  transition: transform 0.2s ease;
  width: 1rem;
`;

export const LocationsSectionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[3]};
  padding-top: ${spacing[3]};
  width: 100%;
`;

export const LocationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[2]};
  width: 100%;
`;
