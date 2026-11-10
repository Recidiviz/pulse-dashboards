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

import { BodyS1, borderRadius, Caption1, palette, spacing } from "../../styles";
import { buttonOutline } from "../common/StyledComponents";

export const ModalRoot = styled.div`
  background: ${palette.background.primary};
  border-radius: ${borderRadius[20]};
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
`;

export const Sidebar = styled.div`
  border-right: 0.0625rem solid ${palette.border.subtle};
  box-sizing: border-box;
  display: flex;
  flex: none;
  flex-direction: column;
  height: 100%;
  width: 22.5rem;
`;

export const SidebarHeader = styled.div`
  align-items: center;
  box-sizing: border-box;
  display: flex;
  flex: none;
  height: 4.625rem;
  padding: 0 ${spacing[4]};
`;

export const SidebarBody = styled.div`
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${spacing[4]};
  padding: 0 ${spacing[4]};
`;

export const MenuList = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

/**
 * Settings are grouped by ownership in the sidebar, so which fields belong to
 * the organization and which to the person is visible before anything is
 * opened.
 */
export const MenuGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[1]};
  width: 100%;

  & + & {
    border-top: 0.0625rem solid ${palette.border.subtle};
    margin-top: ${spacing[3]};
    padding-top: ${spacing[3]};
  }
`;

export const MenuGroupLabel = styled(Caption1).attrs({ as: "h6" })`
  color: ${palette.foreground.tertiary};
  margin: 0;
  padding: 0 ${spacing[3]};
  text-transform: uppercase;
`;

export const MenuItem = styled.button<{ $active: boolean }>`
  align-items: center;
  background: ${({ $active }) =>
    $active ? palette.background.secondary : "transparent"};
  border: none;
  border-radius: ${borderRadius[12]};
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  gap: ${spacing[3]};
  height: 2.5rem;
  padding: 0 ${spacing[3]};
  width: 100%;

  &:focus-visible {
    outline: 0.125rem solid ${palette.state.focus};
  }
`;

export const MenuIcon = styled.div<{ $active: boolean }>`
  align-items: center;
  display: flex;
  flex: none;
  height: 1.25rem;
  justify-content: center;
  opacity: ${({ $active }) => ($active ? 1 : 0.6)};
  width: 1.25rem;

  & > svg {
    height: 100%;
    width: 100%;
  }
`;

export const MenuLabel = styled(BodyS1)`
  color: ${palette.foreground.primary};
  flex: 1;
  text-align: left;
`;

export const RightSide = styled.div`
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  padding-bottom: ${spacing[4]};
`;

export const ModalHeader = styled.div`
  align-items: center;
  box-sizing: border-box;
  display: flex;
  flex: none;
  height: 4.625rem;
  justify-content: space-between;
  padding: ${spacing[4]};
`;

export const CloseButton = styled.button`
  ${buttonOutline}
  align-items: center;
  background: none;
  border: none;
  color: ${palette.foreground.tertiary};
  cursor: pointer;
  display: flex;
  flex: none;
  height: 1rem;
  padding: 0;
  width: 1rem;
  align-self: flex-start;

  & > svg {
    height: 100%;
    width: 100%;
  }
`;

export const RightContent = styled.div`
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${spacing[6]};
  min-height: 0;
  padding: 0 ${spacing[4]};
`;

export const ScrollArea = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
`;

export const StatusContainer = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${spacing[4]};
  justify-content: center;
  padding: ${spacing[6]} 0;
`;

export const ErrorText = styled(BodyS1)`
  color: ${palette.foreground.secondary};
  text-align: center;
`;

export const FooterMessage = styled.div`
  align-items: center;
  display: flex;
  flex: none;
  flex-direction: row;
  gap: ${spacing[2]};
  width: 100%;
`;

export const InfoIcon = styled.div`
  align-items: center;
  display: flex;
  flex: none;
  height: 1.0625rem;
  justify-content: center;
  width: 1.0625rem;

  & > svg {
    height: 100%;
    width: 100%;
  }
`;

export const FooterText = styled(BodyS1)`
  color: ${palette.foreground.primary};
  flex: 1;
`;

export const FooterLink = styled.a`
  color: ${palette.foreground.brand};
`;
