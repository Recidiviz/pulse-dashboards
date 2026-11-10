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
  BodyS1,
  BodyS2,
  borderRadius,
  Caption1,
  fontWeights,
  Heading5,
  palette,
  spacing,
} from "../../styles";
import AvatarBackground from "../assets/avatar-background.svg?url";
import { buttonOutline } from "../common/StyledComponents";

export const ModalContent = styled.div`
  align-items: flex-start;
  background: ${palette.background.primary};
  display: flex;
  flex-direction: row;
  height: 100%;
  overflow: hidden;
  width: 100%;
`;

export const MainPanel = styled.div`
  align-items: flex-start;
  background: ${palette.background.primary};
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  min-width: 0;
  position: relative;
`;

export const DetailStateContainer = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  justify-content: center;
  padding: ${spacing[6]};
  width: 100%;
`;

export const PanelHeader = styled.div`
  align-items: flex-start;
  background: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex: none;
  gap: ${spacing[2]};
  isolation: isolate;
  justify-content: space-between;
  min-height: 4.625rem;
  padding: ${spacing[4]};
  position: relative;
  width: 100%;
`;

export const PanelTitle = styled(Heading5)`
  align-self: center;
  box-sizing: border-box;
  color: ${palette.foreground.primary};
  width: 100%;
`;

export const PanelCloseButton = styled.button`
  ${buttonOutline}
  align-items: center;
  background-color: transparent;
  cursor: pointer;
  display: flex;
  flex: none;
  height: 1rem;
  justify-content: center;
  position: absolute;
  right: ${spacing[4]};
  top: ${spacing[4]};
  width: 1rem;
  z-index: 20;
`;

export const PanelFooter = styled.div`
  align-items: center;
  background: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex: none;
  gap: ${spacing[2]};
  justify-content: flex-end;
  min-height: 3.75rem;
  padding: ${spacing[4]} ${spacing[4]} 0;
  width: 100%;
`;

export const Sidebar = styled.aside`
  align-items: flex-start;
  border-right: 0.0625rem solid ${palette.border.subtle};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: none;
  height: 100%;
  overflow: hidden;
  padding: 0;
  width: 22.7rem;
`;

export const SidebarBodySection = styled.div`
  align-items: flex-start;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${spacing[4]};
  padding: 0 ${spacing[4]};
  width: 100%;
`;

export const SidebarTopContainer = styled.div`
  align-items: flex-start;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  gap: ${spacing[3]};
  width: 100%;
`;

export const RequirementWarningBanner = styled.div`
  align-items: flex-start;
  align-self: stretch;
  background: ${palette.background.warningLight};
  border-radius: ${borderRadius[12]};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${spacing[1]};
  padding: ${spacing[3]};
  width: 100%;
`;

export const RequirementWarningTitle = styled(BodyS2)`
  color: ${palette.foreground.warning};
`;

export const RequirementWarningMessage = styled(Caption1)`
  color: ${palette.foreground.warning};
`;

export const ReleaseDateChangeBanner = styled.div`
  align-items: flex-start;
  align-self: stretch;
  background: ${palette.misc.catskillWhite};
  border-radius: ${borderRadius[12]};
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
  padding: ${spacing[3]};
  width: 100%;
`;

export const DateWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
`;

export const ReleaseDateChangeDot = styled.span`
  background-color: ${palette.misc.seaBlue};
  border-radius: 50%;
  flex: none;
  height: 5px;
  width: 5px;
`;

export const ReleaseDateChangeText = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

export const ReleaseDateChangeDate = styled(BodyS2)`
  color: ${palette.misc.seaBlue};
`;

export const ReleaseDateChangeCaption = styled(Caption1)`
  color: ${palette.misc.seaBlue};
`;

export const ReleaseDateChangeDismissButton = styled.button`
  ${buttonOutline}
  align-items: center;
  background: none;
  border: none;
  color: ${palette.misc.seaBlue};
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

export const SidebarDivider = styled.hr`
  align-self: stretch;
  border: none;
  border-top: 0.0625rem solid ${palette.border.subtle};
  height: 0;
  margin: 0;
  width: 100%;
`;

export const UserNameRow = styled.div`
  align-items: center;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex: none;
  gap: ${spacing[3]};
  height: 4.625rem;
  padding: 0 ${spacing[4]};
  width: 100%;
`;

export const UserNameInner = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  flex: 1;
  gap: ${spacing[3]};
  min-width: 0;
`;

export const Avatar = styled.div`
  align-items: center;
  background-image: url(${AvatarBackground});
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  border-radius: 50%;
  color: ${palette.foreground.onBrand};
  display: inline-flex;
  flex: none;
  font-size: 0.75rem;
  font-weight: 500;
  height: 2.75rem;
  justify-content: center;
  line-height: 1rem;
  text-align: center;
  width: 2.75rem;
`;

export const ClientName = styled(Heading5)`
  color: ${palette.misc.black};
  line-height: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const DateRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${spacing[3]};
  width: 100%;
`;

export const DateInner = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0;
  min-width: 0;
`;

export const DateValue = styled(BodyS2)`
  color: ${palette.foreground.primary};
`;

export const DateLabel = styled(BodyS1)`
  color: ${palette.foreground.secondary};
`;

export const DateIcon = styled.button`
  align-items: center;
  background: ${palette.background.secondary};
  border: none;
  border-radius: ${borderRadius.round};
  cursor: pointer;
  box-sizing: border-box;
  display: flex;
  flex: none;
  height: 2rem;
  justify-content: center;
  padding: 0;
  width: 2rem;
  ${buttonOutline}

  & svg {
    flex: none;
    height: 1rem;
    width: 1rem;
    path {
      stroke: ${palette.foreground.tertiary};
    }
  }
`;

export const NavContainer = styled.nav`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const NavItem = styled.button<{
  $active?: boolean;
}>`
  align-items: center;
  background: ${({ $active }) =>
    $active ? palette.background.secondary : "transparent"};
  border: none;
  border-radius: ${({ $active }) => ($active ? borderRadius[12] : spacing[0])};
  box-sizing: border-box;
  color: ${palette.misc.black};
  cursor: pointer;
  display: flex;
  flex-direction: row;
  gap: ${spacing[3]};
  height: 2.5rem;
  padding: 0 ${spacing[3]};
  width: 100%;
  ${buttonOutline}

  & > *:nth-child(2) {
    font-weight: ${({ $active }) =>
      $active ? fontWeights.medium : fontWeights.regular};
  }
  & svg {
    flex: none;
    path {
      fill: none;
      stroke: ${({ $active }) =>
        $active ? palette.foreground.secondary : palette.foreground.tertiary};
    }
  }
`;

export const TabBadge = styled(Caption1)`
  align-items: center;
  background: ${palette.background.brand};
  border-radius: ${borderRadius.round};
  box-sizing: border-box;
  color: ${palette.foreground.onBrand};
  display: flex;
  flex: none;
  flex-direction: row;
  flex-grow: 0;
  height: 18px;
  min-width: 18px;
  justify-content: center;
  margin-left: auto;
  padding: ${spacing[0.5]} ${spacing[1.5]};
`;

export const StageSection = styled.div`
  align-items: flex-start;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  flex: none;
  gap: ${spacing[2]};
  isolation: isolate;
  width: 100%;
`;

export const StageHeaderRow = styled.div`
  align-items: center;
  align-self: stretch;
  display: flex;
  flex-direction: row;
  flex: none;
  height: 1.625rem;
  justify-content: space-between;
  width: 100%;
`;

export const StageIndicator = styled.div`
  align-items: flex-start;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  flex: none;
  gap: ${spacing[2]};
  width: 100%;
`;

export const StageLabel = styled(BodyS2)`
  color: ${palette.foreground.primary};
`;

export const StageProgressContainer = styled.div`
  align-items: center;
  align-self: stretch;
  background: ${palette.background.secondary};
  border-radius: ${borderRadius[12]};
  box-sizing: border-box;
  display: flex;
  flex: none;
  flex-direction: row;
  min-height: 3.375rem;
  padding: ${spacing[2]};
  width: 100%;
`;

export const StageStep = styled.div`
  align-items: center;
  display: flex;
  flex: none;
  flex-direction: column;
  gap: ${spacing[1]};
  justify-content: center;
  min-height: 2.375rem;
`;

export const ProgressDot = styled.div<{
  $state?: "completed" | "active" | "upcoming";
}>`
  flex: none;
  height: 1.125rem;
  position: relative;
  width: 1.125rem;

  &::before {
    border-radius: 50%;
    border: ${({ $state }) => {
      switch ($state) {
        case "completed":
          return `0.0625rem solid ${palette.background.brand}`;
        case "active":
          return `0.0625rem solid ${palette.border.brand}`;
        default:
          return `0.0625rem dashed ${palette.foreground.tertiary}`;
      }
    }};
    box-sizing: border-box;
    content: "";
    height: 1.125rem;
    left: 0;
    position: absolute;
    top: 0;
    width: 1.125rem;
  }

  ${({ $state }) =>
    $state === "active" &&
    `
    &::after {
      background: ${palette.background.brand};
      border-radius: 50%;
      content: "";
      height: 0.625rem;
      left: ${spacing[1]};
      position: absolute;
      top: ${spacing[1]};
      width: 0.625rem;
    }
  `}

  ${({ $state }) =>
    $state === "completed" &&
    `
    &::before {
      background: ${palette.background.brand};
    }

    &::after {
      content: "";
      position: absolute;
      width: 0.375rem;
      height: 0.5625rem;
      border: solid ${palette.background.primary};
      border-width: 0 0.09375rem 0.09375rem 0;
      left: 0.375rem;
      top: 0.25rem;
      transform: rotate(45deg) translateY(-0.0625rem) translateX(-0.0625rem);
    }
  `}
`;

export const StageStepLabel = styled(Caption1)<{ $active?: boolean }>`
  color: ${({ $active }) =>
    $active ? palette.foreground.primary : palette.foreground.secondary};
  text-align: center;
`;

export const StageConnector = styled.div`
  align-self: flex-start;
  border-top: 0.0625rem solid ${palette.border.subtle};
  flex: 1 1 auto;
  height: 0;
  margin-top: 0.5625rem;
  min-width: 0;
`;

export const SubstageRow = styled.div`
  align-items: center;
  align-self: stretch;
  display: flex;
  flex: none;
  flex-direction: row;
  gap: ${spacing[1]};
  height: 1rem;
  width: 100%;
`;

export const SubstageText = styled(Caption1)`
  color: ${palette.foreground.secondary};
  flex: 1;
`;

export const SubstageIcon = styled.span`
  align-items: center;
  display: flex;
  flex: none;
  height: 0.75rem;
  justify-content: center;
  width: 0.75rem;

  & svg {
    display: block;
    height: 0.75rem;
    width: 0.75rem;
    path {
      fill: none;
      stroke: ${palette.foreground.secondary};
    }
  }
`;
