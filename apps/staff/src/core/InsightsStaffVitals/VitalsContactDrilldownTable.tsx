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
import styled from "styled-components";

import { VitalsSupervisionContacts } from "~datatypes";
import { spacing, typography } from "~design-system";
import { Icon, palette } from "~design-system";

import SortIcon from "../../assets/static/images/sortIcon.svg?react";
import { ConfigLabels } from "../../InsightsStore/presenters/types";
import { formatWorkflowsDate } from "../../utils";
import { toTitleCase } from "../../utils";
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

type VitalsContactDrilldownTableProps = {
  contacts: VitalsSupervisionContacts[];
  bodyDisplayName: string;
  labels: ConfigLabels;
};

export const VitalsContactrilldownTable = observer(
  function VitalsContactrilldownTable({
    contacts,
    bodyDisplayName,
    labels,
  }: VitalsContactDrilldownTableProps) {
    const columns = useMemo<ColumnDef<VitalsSupervisionContacts>[]>(
      () => [
        {
          accessorKey: "fullName",
          header: "Name",
          // eslint-disable-next-line react/no-unstable-nested-components
          cell: (info) => {
            const displayName = toTitleCase(info.row.original.fullName);
            return <span>{displayName}</span>;
          },
        },
        {
          accessorKey: "displayPersonExternalId",
          header: labels.supervisionDisplayIdCopy,
          // react-table wants the columns memoized, so I think this is ok
          // eslint-disable-next-line react/no-unstable-nested-components
          cell: (info) => {
            const displayId = info.getValue() as string;
            return (
              <PersonId
                personId={displayId}
                pseudoId={info.row.original.personId.toString()}
                systemType="SUPERVISION"
                shiftIcon
              >
                {displayId}
              </PersonId>
            );
          },
        },
        {
          accessorKey: "contactDueDate",
          header: "Due",
          sortingFn: "datetime",
          // eslint-disable-next-line react/no-unstable-nested-components
          cell: (info) => {
            const contactDueDate = formatWorkflowsDate(
              info.row.getValue("contactDueDate"),
            );

            return (
              <span style={{ whiteSpace: "nowrap" }}>
                {contactDueDate}
                {!info.row.original.contactCompleted && (
                  <StatusIcon
                    kind="Error"
                    tooltip={`${bodyDisplayName} not completed by due date`}
                  />
                )}
              </span>
            );
          },
        },
        {
          accessorKey: "contactType",
          header: "Contact Type",
        },
        {
          accessorKey: "contactCompletedDate",
          header: "Completed",
          sortingFn: (a, b, colId) => {
            const aVal = a.getValue<string | null>(colId);
            const bVal = b.getValue<string | null>(colId);
            if (!aVal && !bVal) return 0;
            if (!aVal) return -1;
            if (!bVal) return 1;
            return new Date(bVal).getTime() - new Date(aVal).getTime();
          },
          // eslint-disable-next-line react/no-unstable-nested-components
          cell: (info) => {
            const contactCompletedDate = info.row.getValue(
              "contactCompletedDate",
            )
              ? formatWorkflowsDate(info.row.getValue("contactCompletedDate"))
              : "";

            return <span>{contactCompletedDate}</span>;
          },
        },
      ],
      [labels.supervisionDisplayIdCopy, bodyDisplayName],
    );

    const table = useReactTable({
      data: contacts,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      initialState: {
        sorting: [{ id: "contactCompletedDate", desc: false }],
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
