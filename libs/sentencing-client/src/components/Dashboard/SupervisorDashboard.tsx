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

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { sortFullNameByLastNameDescending } from "../../utils/sorting";
import { capitalizeName, formatPercentage } from "../../utils/utils";
import SortIcon from "../assets/sort-icon.svg?react";
import { InfoIconWithTooltip } from "../Tooltip/Tooltip";
import * as Styled from "./Dashboard.styles";
import { SupervisorStats } from "./types";

const columns: ColumnDef<{
  fullName: string;
  caseCompletionRate: number;
  activeCasesAssigned: number;
}>[] = [
  {
    header: "Name",
    accessorKey: "fullName",
    sortingFn: (rowA, rowB) =>
      sortFullNameByLastNameDescending(
        rowA.original.fullName,
        rowB.original.fullName,
      ),
    cell: (name) => {
      const clientName = name.getValue<string>() ?? "No name found";
      return <div>{capitalizeName(clientName)}</div>;
    },
  },
  {
    header: "Cases Due (Past 30 Days)",
    accessorKey: "totalCasesDueLast30Days",
    cell: (cell) => {
      const totalCasesDueLast30Days = cell.getValue<number>();

      return <div>{totalCasesDueLast30Days}</div>;
    },
  },
  {
    header: "Case Completion (Past 30 Days)",
    accessorKey: "caseCompletionRate",
    cell: (cell) => {
      const completionRate = cell.getValue<number>();

      return (
        <Styled.StatCell percentage={completionRate}>
          {formatPercentage(completionRate)}
        </Styled.StatCell>
      );
    },
  },
  {
    header: "Cases Currently Assigned",
    accessorKey: "activeCasesAssigned",
  },
];

export const SupervisorDashboard = ({
  supervisorStats,
}: {
  supervisorStats: SupervisorStats;
}) => {
  const { topLineStats, staffStats } = supervisorStats ?? {};
  const teamUsageRate = formatPercentage(topLineStats?.teamUsageRate);
  const totalCaseCompletionRate = formatPercentage(
    topLineStats?.totalCaseCompletionRate,
  );

  const table = useReactTable({
    data: staffStats ?? [],
    columns,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
  });

  if (!topLineStats || !staffStats) return null;

  return (
    <Styled.SupervisorDashboardContainer>
      <Styled.Header>
        <Styled.TitleWrapper>
          <Styled.TableTitle>PSI Team Dashboard</Styled.TableTitle>
        </Styled.TitleWrapper>
      </Styled.Header>

      {/* Top Line Stats */}
      <Styled.TopLineStats>
        <Styled.StatsDescription>
          Performance Highlights <span>(Past 30 days)</span>
        </Styled.StatsDescription>
        <Styled.StatsWrapper>
          <Styled.StatCard>
            <Styled.Stat>{topLineStats.casesDue}</Styled.Stat>
            <Styled.StatLabel>Cases Due</Styled.StatLabel>
          </Styled.StatCard>
          <Styled.StatCard>
            <Styled.Stat percentage={topLineStats?.teamUsageRate}>
              {teamUsageRate}
            </Styled.Stat>
            <Styled.StatLabel>
              Team Usage{" "}
              <InfoIconWithTooltip content="Team usage is the percent of investigators with cases due in the last 30 days who recorded a recommendation for at least one of those cases in the tool" />
            </Styled.StatLabel>
          </Styled.StatCard>
          <Styled.StatCard>
            <Styled.Stat percentage={topLineStats?.totalCaseCompletionRate}>
              {totalCaseCompletionRate}
            </Styled.Stat>
            <Styled.StatLabel>
              Case Completion{" "}
              <InfoIconWithTooltip content="Case completion is the percent of cases due in the last 30 days for which a recommendation was recorded in the tool" />
            </Styled.StatLabel>
          </Styled.StatCard>
        </Styled.StatsWrapper>
      </Styled.TopLineStats>

      {/* Stats by Investigator */}
      <Styled.Table>
        <Styled.TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <Styled.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Styled.HeaderCell key={header.id} colSpan={header.colSpan}>
                  <Styled.SortableHeader
                    sortable={header.column.getCanSort()}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {header.column.getCanSort() && (
                      <Styled.SortIconWrapper
                        sortDirection={header.column.getIsSorted()}
                      >
                        <SortIcon />
                      </Styled.SortIconWrapper>
                    )}
                  </Styled.SortableHeader>
                </Styled.HeaderCell>
              ))}
            </Styled.Row>
          ))}
        </Styled.TableHeader>
        <Styled.TableBody>
          {table.getRowModel().rows.map((row) => (
            <Styled.Row key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <Styled.Cell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Styled.Cell>
              ))}
            </Styled.Row>
          ))}
          {staffStats.length === 0 && (
            <Styled.Row>
              <Styled.Cell>No staff to display</Styled.Cell>
            </Styled.Row>
          )}
        </Styled.TableBody>
      </Styled.Table>
    </Styled.SupervisorDashboardContainer>
  );
};
