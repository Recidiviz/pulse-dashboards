// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { Icon, spacing, TooltipTrigger, typography } from "@recidiviz/design-system";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortDirection,
  useReactTable,
} from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useMemo } from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import SortIcon from "../../assets/static/images/sortIcon.svg?react";
import { formatWorkflowsDate } from "../../utils";
import { SupervisionTask } from "../../WorkflowsStore";
import PersonId, { PersonIdWithCopyIcon } from "../PersonId/PersonId";

const Table = styled.table`
  width: 100%;
  ${typography.Sans14};
  text-align: left;
  border-collapse: separate;
  border-spacing: 0;
`;

const SortableHeader = styled.div<{ $sortable?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  cursor: ${({ $sortable }) => ($sortable ? "pointer" : "default")};
`;

const SharedTableCellStyles = `
  height: 49px;
  padding: ${rem(spacing.xs)} ${rem(spacing.lg)};
  border-bottom: 1px solid ${palette.slate10};
  font-weight: 500;
`;

const HeaderCell = styled.th`
  ${SharedTableCellStyles}
  color: ${palette.slate80};
`;

const Cell = styled.td`
  ${SharedTableCellStyles}
  color: ${palette.pine1};
  min-width: 100px;

  ${PersonIdWithCopyIcon} {
    color: ${palette.pine1};
  }
`;

const svgPathFillCSS = `
  fill-opacity: 1 !important;
  fill: ${palette.slate80}
`;

const SortIconWrapper = styled.div<{
  $sortDirection: false | SortDirection;
}>`
  color: ${palette.slate30};

  ${({ $sortDirection }) => {
    if ($sortDirection === "asc") {
      return `
          svg > path:first-child {
            ${svgPathFillCSS}
          }
        `;
    }
    if ($sortDirection === "desc") {
      return `
          svg > path:last-child {
            ${svgPathFillCSS}
          }
        `;
    }
    return "";
  }};
`;

const StatusIcon = ({
  kind,
  tooltip,
}: {
  kind: React.ComponentProps<typeof Icon>["kind"];
  tooltip: React.ComponentProps<typeof TooltipTrigger>["contents"];
}) => (
  <TooltipTrigger contents={tooltip}>
    <Icon
      kind={kind}
      color={palette.slate60}
      size="16"
      style={{
        marginLeft: rem(spacing.sm),
        verticalAlign: "top",
      }}
    />
  </TooltipTrigger>
);

type VitalsTaskDrilldownTableProps = {
  tasks: SupervisionTask[];
  docLabel: string;
  bodyDisplayName: string;
};

export const VitalsTaskDrilldownTable = observer(
  function VitalsTaskDrilldownTable({
    tasks,
    docLabel,
    bodyDisplayName,
  }: VitalsTaskDrilldownTableProps) {
    const columns = useMemo<ColumnDef<SupervisionTask>[]>(
      () => [
        {
          accessorKey: "person.displayName",
          header: "Name",
        },
        {
          accessorKey: "person.displayId",
          header: `${docLabel} ID`,
          // react-table wants the columns memoized, so I think this is ok
          // eslint-disable-next-line react/no-unstable-nested-components
          cell: (info) => {
            const displayId = info.getValue() as string;
            return (
              <PersonId
                personId={displayId}
                docLabel={docLabel}
                pseudoId={info.row.original.person.pseudonymizedId}
                shiftIcon
              >
                {displayId}
              </PersonId>
            );
          },
        },
        {
          accessorKey: "dueDate",
          header: "Due",
          // eslint-disable-next-line react/no-unstable-nested-components
          cell: (info) => {
            const task = info.row.original; // Get the full task object;

            const formattedDate = formatWorkflowsDate(task.dueDate);

            return (
              <span>
                {formattedDate}
                {task.isOverdue && (
                  <StatusIcon
                    kind="Error"
                    tooltip={`${bodyDisplayName} is overdue`}
                  />
                )}
                {task.isSnoozed && (
                  <StatusIcon
                    kind="Clock"
                    tooltip={`${bodyDisplayName} is snoozed until ${formatWorkflowsDate(
                      task.snoozeInfo?.snoozedUntil,
                    )}`}
                  />
                )}
              </span>
            );
          },
        },
      ],
      [docLabel, bodyDisplayName],
    );

    const table = useReactTable({
      data: tasks,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      initialState: {
        sorting: [{ id: "dueDate", desc: false }],
      },
    });

    return (
      <Table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <HeaderCell key={header.id}>
                  <SortableHeader
                    $sortable={header.column.getCanSort()}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {header.column.getCanSort() && (
                      <SortIconWrapper
                        $sortDirection={header.column.getIsSorted()}
                      >
                        <SortIcon />
                      </SortIconWrapper>
                    )}
                  </SortableHeader>
                </HeaderCell>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <Cell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Cell>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    );
  },
);
