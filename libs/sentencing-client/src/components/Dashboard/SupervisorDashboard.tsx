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
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { observer } from "mobx-react-lite";

import { withPresenterManager } from "~hydration-utils";

import { PSIStore } from "../../datastores/PSIStore";
import { SupervisorPresenter } from "../../presenters/SupervisorPresenter";
import { formatPercentage } from "../../utils/utils";
import SortIcon from "../assets/sort-icon.svg?react";
import { PageHydrator } from "../PageHydrator/PageHydrator";
import { InfoIconWithTooltip } from "../Tooltip/Tooltip";
import * as Styled from "./Dashboard.styles";
import { supervisorStatsColumns } from "./SupervisorDashboard.columns";

const ManagedComponent = observer(function SupervisorDashboard({
  presenter,
}: {
  presenter: SupervisorPresenter;
}) {
  const { supervisorStats } = presenter;
  const { topLineStats, staffStats } = supervisorStats ?? {};

  const teamUsageRate = formatPercentage(topLineStats?.teamUsageRate);
  const totalCaseCompletionRate = formatPercentage(
    topLineStats?.totalCaseCompletionRate,
  );

  const table = useReactTable({
    data: staffStats ?? [],
    columns: supervisorStatsColumns,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
  });

  if (!topLineStats || !staffStats) return null;

  return (
    <Styled.PageContainer>
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
    </Styled.PageContainer>
  );
});

function usePresenter({ psiStore }: { psiStore: PSIStore }) {
  const { supervisorStore } = psiStore;

  return new SupervisorPresenter(supervisorStore);
}

export const SupervisorDashboard = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
  HydratorComponent: PageHydrator,
});
