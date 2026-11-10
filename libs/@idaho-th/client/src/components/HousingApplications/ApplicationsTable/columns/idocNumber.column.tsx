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

import { HousingApplication } from "../../../../interfaces/common";
import * as Styled from "../ApplicationsTable.styles";

export const idocNumberColumn: ColumnDef<HousingApplication> = {
  id: "idocNumber",
  accessorKey: "idocNumber",
  enableSorting: true,
  header: "IDOC#",
  meta: { textAlign: "right", width: "10rem" },
  cell: ({ row }) => {
    const idocNumber = row.original.idocNumber ?? "";
    return (
      <Styled.ResponsesCell>
        <Styled.CellSlot $align="end">{idocNumber}</Styled.CellSlot>
      </Styled.ResponsesCell>
    );
  },
};
