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
  Caption1,
  palette,
  spacing,
} from "../../../../styles";

export const Root = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: ${spacing[2]};
  width: 100%;
`;

export const HeaderRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
`;

export const Title = styled(BodyM1)`
  color: ${palette.foreground.primary};
`;

export const Count = styled(BodyS1)`
  color: ${palette.foreground.secondary};
  flex: none;
  white-space: nowrap;
`;

export const Subtitle = styled(BodyS1)`
  color: ${palette.foreground.secondary};
  width: 100%;
`;

export const TaskList = styled.div<{ $disabled?: boolean }>`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
  width: 100%;
  gap: ${spacing[1.5]};
  margin-top: ${spacing[4]};
`;

export const TaskItem = styled.div<{ $dimmed?: boolean }>`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
  opacity: ${({ $dimmed }) => ($dimmed ? 0.6 : 1)};
  width: 100%;
`;

export const TaskLabelRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  flex: 1;
  gap: ${spacing[1]};
  min-width: 0;
`;

export const TaskLabel = styled(BodyS1)<{ $checked?: boolean }>`
  color: ${palette.foreground.primary};
  flex: none;
`;

export const TaskSeparator = styled.div`
  align-self: stretch;
  border-left: 0.0625rem solid ${palette.border.subtle};
  height: 0.75rem;
  margin-left: 0.5625rem;
  width: 0;
`;

export const OwnerBadge = styled.div<{ $own?: boolean }>`
  align-items: center;
  background: ${({ $own }) =>
    $own ? palette.misc.catskillWhite : palette.background.secondary};
  border-radius: ${borderRadius[4]};
  display: flex;
  flex: none;
  padding: 0 ${spacing[1]};
`;

export const OwnerBadgeText = styled(Caption1)<{ $own?: boolean }>`
  color: ${({ $own }) =>
    $own ? palette.misc.seaBlue : palette.foreground.secondary};
  white-space: nowrap;
`;
