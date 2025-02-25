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

import { ColumnDef, Row } from "@tanstack/react-table";

import { Client } from "../../WorkflowsStore";
import { CaseloadTasksPresenter } from "../../WorkflowsStore/presenters/CaseloadTasksPresenter";
import PersonId from "../PersonId";

export function TasksTable({
  presenter,
}: {
  presenter: CaseloadTasksPresenter;
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const columns: ColumnDef<Client>[] = [
    {
      header: "Name",
      id: "displayName",
      accessorKey: "displayName",
      enableSorting: true,
      sortingFn: "text",
    },
    {
      // TODO(#6737): Make the column header the same as the label displayed when copied
      header: "DOC ID",
      id: "displayId",
      accessorKey: "displayId",
      enableSorting: true,
      sortingFn: "alphanumeric",
      // eslint-disable-next-line react/no-unstable-nested-components
      cell: ({ row }: { row: Row<Client> }) => {
        const person = row.original;
        return (
          <PersonId
            personId={person.displayId}
            pseudoId={person.pseudonymizedId}
          >
            {person.displayId}
          </PersonId>
        );
      },
    },
    {
      header: "Case Type",
      id: "caseType",
      accessorKey: "supervisionType",
      enableSorting: true,
      sortingFn: "text",
    },
    {
      header: "Supervision",
      id: "supervisionLevel",
      accessorKey: "supervisionType",
      enableSorting: true,
      sortingFn: "text",
    },
    {
      header: "Tasks due",
      id: "supervisionLevel",
      accessorKey: "supervisionType",
      enableSorting: true,
      sortingFn: "alphanumeric",
      cell: ({ row }: { row: Row<Client> }) => {
        const person = row.original;
        return person.supervisionTasks?.tasks.length ?? 0;
      },
    },
  ];

  return <div />;
}
