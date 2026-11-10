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
  BodyM2,
  BodyS1,
  BodyS2,
  palette,
  spacing,
} from "../../../styles";
import ArrowDown from "../../assets/arrow-down.svg?react";

export const PanelRoot = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

export const PanelBody = styled.div`
  align-items: flex-start;
  background: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: ${spacing[2]};
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  padding: 0 ${spacing[4]} ${spacing[4]};
  width: 100%;
`;

export const TimelineList = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const TimelineItem = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${spacing[3]};
  width: 100%;
`;

export const TimelineIndicator = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  flex: none;
  width: 12px;
`;

export const TimelineConnectorTop = styled.div<{ $visible: boolean }>`
  background: ${palette.border.subtle};
  flex: none;
  height: 20px;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  width: 1px;
`;

export const TimelineDot = styled.div<{ $active: boolean }>`
  background: ${({ $active }) =>
    $active ? palette.background.brand : palette.border.subtle};
  border-radius: 50%;
  flex: none;
  height: 8px;
  width: 8px;
`;

export const TimelineConnectorBottom = styled.div<{ $visible: boolean }>`
  background: ${palette.border.subtle};
  flex: 1;
  min-height: 16px;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  width: 1px;
`;

export const TimelineContent = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  gap: ${spacing[3]};
  min-width: 0;
  padding-bottom: ${spacing[4]};
`;

export const TimelineTextGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 2px;
  min-width: 0;
`;

export const TimelineActor = styled(BodyS1)`
  color: ${palette.foreground.secondary};
`;

export const TimelineDescription = styled(BodyM1)`
  color: ${palette.foreground.primary};
`;

export const TimelineMessageContainer = styled.div<{ $expanded: boolean }>`
  ${({ $expanded }) =>
    !$expanded &&
    `
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    display: -webkit-box;
    overflow: hidden;
  `}
`;

export const TimelineDescriptionLabel = styled(BodyM2)`
  color: ${palette.foreground.primary};
`;

export const TimelineMessageText = styled(BodyM1)`
  color: ${palette.foreground.primary};
`;

export const TimelineMessageToggle = styled.button`
  align-items: center;
  background: none;
  border: none;
  color: ${palette.foreground.brand};
  cursor: pointer;
  display: flex;
  flex-direction: row;
  gap: ${spacing[1]};
  padding: 0;
`;

export const TimelineToggleLabel = styled(BodyS2)`
  color: ${palette.foreground.brand};
`;

export const TimelineToggleChevron = styled(ArrowDown)<{
  $expanded: boolean;
}>`
  flex: none;
  height: 0.75rem;
  transform: rotate(${({ $expanded }) => ($expanded ? "-180deg" : "0deg")});
  transition: transform 0.15s ease;
  width: 0.75rem;
`;

export const TimelineDate = styled(BodyS1)`
  color: ${palette.foreground.secondary};
  flex: none;
  padding-top: 2px;
  white-space: nowrap;
`;

export const EmptyState = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  justify-content: center;
  width: 100%;
`;
