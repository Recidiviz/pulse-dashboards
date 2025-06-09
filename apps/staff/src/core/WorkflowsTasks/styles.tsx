// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import {
  // palette,
  Pill,
  Sans14,
  Serif34,
  spacing,
} from "@recidiviz/design-system";
import { rem } from "polished";
import styled, { FlattenSimpleInterpolation } from "styled-components/macro";

import { palette } from "~design-system";

import { MaxWidth } from "../sharedComponents";

export const Divider = styled.hr`
  margin: ${rem(spacing.md)} 0;
  height: 1px;
  border: none;
  background-color: ${palette.slate20};
`;

export const TasksHeader = styled(Serif34)`
  color: ${palette.pine2};
  margin-bottom: ${rem(spacing.md)};

  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
`;

export const TasksCaption = styled(Sans14)`
  color: ${palette.slate70};
`;

export const TasksDescription = styled(TasksCaption)`
  margin-bottom: ${rem(spacing.lg)};
  max-width: ${rem(540)};
`;

export const TasksBodyContainer = styled.div`
  ${MaxWidth}
`;

export const TaskCategoryPill = styled(Pill).attrs({
  color: palette.slate10,
})`
  cursor: pointer;
  color: ${palette.slate85};
`;

export const TaskCategories = styled.div`
  display: flex;
  flex-wrap: wrap;
  row-gap: ${rem(spacing.sm)};
`;

export const TaskAggregateCount = styled.span`
  color: ${palette.signal.links};
`;

export const TaskDivider = styled.hr`
  margin: ${rem(spacing.md)} 0;
  height: 1px;
  border: none;
  background-color: ${palette.slate20};
`;

export const TaskDueDate = styled.div<{
  overdue: boolean;
  font: FlattenSimpleInterpolation;
  marginLeft?: string;
  isMobile?: boolean;
}>`
  ${({ font }) => font}
  color: ${({ overdue }) => (overdue ? palette.signal.error : palette.slate70)};
  margin-left: ${({ marginLeft = "auto" }) => marginLeft};
  ${({ isMobile }) => isMobile && `font-size: ${rem(12)} !important;`}
`;
