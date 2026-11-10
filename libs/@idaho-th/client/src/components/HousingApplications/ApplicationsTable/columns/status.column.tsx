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

import { ColumnDef } from "@tanstack/react-table";

import { APPLICATION_STATUS } from "~@idaho-th/shared";

import { HousingApplication } from "../../../../interfaces/common";
import { StatusBadge } from "../../../StatusBadge";
import * as Styled from "../ApplicationsTable.styles";

// PENDING: handle provider and cm status separately.
export const statusColumn: ColumnDef<HousingApplication> = {
  id: "status",
  accessorKey: "status",
  header: "Status",
  enableSorting: true,
  cell: ({ row }) => (
    <Styled.StatusCell>
      <Styled.CellSlot>
        <StatusBadge
          status={row.original?.status ?? APPLICATION_STATUS.WAITING}
        />
      </Styled.CellSlot>
    </Styled.StatusCell>
  ),
};
