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

import { TooltipTrigger } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import { Icon, palette, spacing } from "~design-system";

import { formatWorkflowsDate } from "../../utils";

const DueDateWrapper = styled.span<{ $overdue: boolean }>`
  white-space: nowrap;
  ${({ $overdue }) => $overdue && `color: ${palette.signal.error};`}
`;

export const StatusIcon = ({
  kind,
  tooltip,
  color = palette.slate60,
}: {
  kind: React.ComponentProps<typeof Icon>["kind"];
  tooltip: React.ComponentProps<typeof TooltipTrigger>["contents"];
  color?: string;
}) => (
  <TooltipTrigger contents={tooltip}>
    <Icon
      kind={kind}
      color={color}
      size="16"
      style={{
        marginLeft: rem(spacing.sm),
        verticalAlign: "top",
      }}
    />
  </TooltipTrigger>
);

/**
 * Due date cell for the vitals drilldown tables. Overdue dates render in red
 * with an error icon; children render after the date for extra status icons.
 */
export const VitalsDueDateCell = ({
  date,
  isOverdue,
  overdueTooltip,
  children,
}: {
  date: Date;
  isOverdue: boolean;
  overdueTooltip: string;
  children?: React.ReactNode;
}) => (
  <DueDateWrapper $overdue={isOverdue}>
    {formatWorkflowsDate(date)}
    {isOverdue && (
      <StatusIcon
        kind="Error"
        color={palette.signal.error}
        tooltip={overdueTooltip}
      />
    )}
    {children}
  </DueDateWrapper>
);
