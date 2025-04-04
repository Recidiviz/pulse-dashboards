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

import { ColumnDef } from "@tanstack/react-table";

import { sortFullNameByLastNameDescending } from "../../utils/sorting";
import { capitalizeName, formatPercentage } from "../../utils/utils";
import * as Styled from "./Dashboard.styles";

export const supervisorStatsColumns: ColumnDef<{
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
