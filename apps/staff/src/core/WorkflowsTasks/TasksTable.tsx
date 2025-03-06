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
import { observer } from "mobx-react-lite";

import { Client, SupervisionTask } from "../../WorkflowsStore";
import { CaseloadTasksPresenterV2 } from "../../WorkflowsStore/presenters/CaseloadTasksPresenterV2";
import { CaseloadTable } from "../OpportunityCaseloadView/CaseloadTable";
import PersonId from "../PersonId";

export const TasksTable = observer(function TasksTable({
  presenter,
}: {
  presenter: CaseloadTasksPresenterV2;
}) {
  const columns: ColumnDef<SupervisionTask>[] = [
    {
      header: "Name",
      id: "person.displayName",
      accessorKey: "person.displayName",
      enableSorting: true,
      sortingFn: "text",
    },
    {
      // TODO(#6737): Make the column header the same as the label displayed when copied
      header: "DOC ID",
      id: "person.displayId",
      accessorKey: "person.displayId",
      enableSorting: true,
      sortingFn: "alphanumeric",
      // eslint-disable-next-line react/no-unstable-nested-components
      cell: ({ row }: { row: Row<SupervisionTask> }) => {
        const person = row.original.person;
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
      header: "Supervision",
      id: "person.supervisionLevel",
      accessorKey: "person.supervisionLevel",
      enableSorting: true,
      sortingFn: "text",
      // eslint-disable-next-line react/no-unstable-nested-components
      cell: observer(function SupervisionCell({ row }) {
        return (row.original.person as Client).supervisionLevel;
      }),
    },
    {
      header: "Tasks due",
      id: "tasksDue",
      cell: ({ row }: { row: Row<SupervisionTask> }) => {
        const person = row.original.person;
        return person.supervisionTasks?.tasks.length ?? 0;
      },
    },
    {
      header: "Task",
      id: "dueDateDisplayLong",
      accessorKey: "dueDateDisplayLong",
    },
  ];

  return (
    <CaseloadTable
      expandedLastColumn
      data={presenter.orderedTasksForSelectedCategory}
      columns={columns}
      onRowClick={(task) => {
        presenter.selectPerson(task.person);
      }}
      shouldHighlightRow={(task) => presenter.shouldHighlightTask(task)}
    />
  );
});
