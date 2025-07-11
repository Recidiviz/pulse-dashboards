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

import { spacing } from "@recidiviz/design-system";
import { ColumnDef, Row } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import useIsMobile from "../../hooks/useIsMobile";
import {
  formatDueDateFromToday,
  formatWorkflowsDate,
} from "../../utils/formatStrings";
import { SupervisionTask } from "../../WorkflowsStore";
import { CaseloadTasksPresenterV2 } from "../../WorkflowsStore/presenters/CaseloadTasksPresenterV2";
import { CaseloadTable } from "../OpportunityCaseloadView/CaseloadTable";
import {
  EmptyTabGroupWrapper,
  EmptyTabText,
  MaxWidthFlexWrapper,
} from "../OpportunityCaseloadView/HydratedOpportunityPersonList";
import PersonId from "../PersonId";
import { WorkflowsStatusPill } from "../WorkflowsStatusPill/WorkflowsStatusPill";
import { TaskFrequency } from "./TaskFrequency";

const PersonNameElement = styled.div<{ $isMobile: boolean }>`
  display: flex;
  flex-direction: ${({ $isMobile }) => ($isMobile ? "column" : "row")};
  align-items: ${({ $isMobile }) => ($isMobile ? "flex-start" : "center")};
  text-wrap: nowrap;
  gap: ${({ $isMobile }) => rem($isMobile ? spacing.xs : spacing.sm)};
`;

function PersonNameCell({ row }: { row: Row<SupervisionTask> }) {
  const { isMobile } = useIsMobile(true);
  const { person } = row.original;
  return (
    <PersonNameElement $isMobile={isMobile}>
      {person.displayName} <WorkflowsStatusPill person={person} />
    </PersonNameElement>
  );
}

function PersonIdCell({ row }: { row: Row<SupervisionTask> }) {
  const { person } = row.original;
  return (
    <PersonId personId={person.displayId} pseudoId={person.pseudonymizedId}>
      {person.displayId}
    </PersonId>
  );
}

const KeepTogether = styled.span`
  white-space: nowrap;
`;

function TaskDateCell({ row }: { row: Row<SupervisionTask> }) {
  const { dueDate } = row.original;
  return (
    <>
      {formatWorkflowsDate(dueDate)}{" "}
      <KeepTogether>{`(${formatDueDateFromToday(dueDate)})`}</KeepTogether>
    </>
  );
}

function FrequencyCell({ row }: { row: Row<SupervisionTask> }) {
  return <TaskFrequency task={row.original} />;
}

export const EmptyTasksTabView = ({
  presenter,
}: {
  presenter: CaseloadTasksPresenterV2;
}) => {
  return (
    <MaxWidthFlexWrapper>
      <EmptyTabGroupWrapper>
        <EmptyTabText>{presenter.emptyTabText}</EmptyTabText>
        <EmptyTabText>
          If you think this is inaccurate, please contact support at{" "}
          <Link to={"mailto:feedback@recidiviz.org"}>
            feedback@recidiviz.org
          </Link>
          .
        </EmptyTabText>
      </EmptyTabGroupWrapper>
    </MaxWidthFlexWrapper>
  );
};

export const TasksTable = observer(function TasksTable({
  presenter,
}: {
  presenter: CaseloadTasksPresenterV2;
}) {
  if (presenter.orderedTasksForSelectedCategory.length === 0) {
    return <EmptyTasksTabView presenter={presenter} />;
  }

  const columns: ColumnDef<SupervisionTask>[] = [
    {
      header: "Name",
      id: "name",
      accessorFn: (task: SupervisionTask) =>
        // Sort by surname if available, full displayed name if not
        task.person.record.personName.surname ?? task.person.displayName,
      enableSorting: true,
      sortingFn: "text",
      cell: PersonNameCell,
    },
    {
      // TODO(#6737): Make the column header the same as the label displayed when copied
      header: presenter.supervisionDisplayIdCopy,
      id: "id",
      accessorKey: "person.displayId",
      enableSorting: true,
      sortingFn: "alphanumeric",
      cell: PersonIdCell,
    },
    {
      header: "Task",
      id: "task",
      accessorKey: "displayName",
      enableSorting: true,
    },
    {
      header: "Recommended",
      id: "date",
      enableSorting: true,
      accessorKey: "dueDate",
      cell: TaskDateCell,
    },
    {
      header: "Frequency",
      id: "frequency",
      enableSorting: false,
      cell: FrequencyCell,
    },
    {
      header: "Supervision Level",
      id: "supervisionLevel",
      accessorKey: "person.supervisionLevel",
      enableSorting: true,
    },
    {
      header: "Case Type",
      id: "caseType",
      accessorKey: "person.caseType",
      enableSorting: true,
    },
    {
      header: "Tasks due",
      id: "tasksDue",
      enableSorting: true,
      accessorFn: (task) => {
        const person = task.person;
        return person.supervisionTasks?.tasks.length ?? 0;
      },
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
