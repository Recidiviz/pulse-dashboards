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

import { spacing, TooltipTrigger } from "@recidiviz/design-system";
import { ColumnDef, Row } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import useIsMobile from "../../hooks/useIsMobile";
import {
  formatDueDateFromToday,
  formatWorkflowsDate,
  toTitleCase,
} from "../../utils/formatStrings";
import { Client, SupervisionTask } from "../../WorkflowsStore";
import { CaseloadTasksPresenterV2 } from "../../WorkflowsStore/presenters/CaseloadTasksPresenterV2";
import { CaseloadTable } from "../OpportunityCaseloadView/CaseloadTable";
import {
  EmptyStateText,
  EmptyStateWrapper,
  MaxWidthFlexWrapper,
} from "../OpportunityCaseloadView/HydratedOpportunityPersonList";
import PersonId from "../PersonId";
import { InfoButton } from "../WorkflowsJusticeInvolvedPersonProfile/InfoButton";
import WorkflowsOfficerName from "../WorkflowsOfficerName";
import { WorkflowsStatusPill } from "../WorkflowsStatusPill/WorkflowsStatusPill";
import { TaskFrequency } from "./TaskFrequency";

const PersonNameElement = styled.div.attrs({
  className: "fs-exclude",
})<{ $isMobile: boolean }>`
  display: flex;
  flex-direction: ${({ $isMobile }) => ($isMobile ? "column" : "row")};
  align-items: ${({ $isMobile }) => ($isMobile ? "flex-start" : "center")};
  text-wrap: nowrap;
  gap: ${({ $isMobile }) => rem($isMobile ? spacing.xs : spacing.sm)};
`;

const StyledInfoButton = styled.span`
  color: ${palette.slate60};
`;

function PersonNameCell({ row }: { row: Row<SupervisionTask> }) {
  const { isMobile } = useIsMobile(true);
  const { person } = row.original;
  const displayName =
    person.stateCode === "US_TX"
      ? person.displayPreferredNameLastFirst
      : person.displayPreferredName;
  return (
    <PersonNameElement $isMobile={isMobile}>
      {displayName} <WorkflowsStatusPill person={person} />
    </PersonNameElement>
  );
}

function OfficerNameCell({ row }: { row: Row<SupervisionTask> }) {
  return row.original.person.assignedStaffId ? (
    <WorkflowsOfficerName officerId={row.original.person.assignedStaffId} />
  ) : (
    // for type safety, but we should not show this column for anyone without an officer
    "—"
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

function CaseTypeCell({ row }: { row: Row<SupervisionTask> }) {
  const { person } = row.original;
  const { caseType } = person as Client;
  return (
    <>
      {caseType}{" "}
      {caseType.toLowerCase().startsWith("substance abuse") &&
        person.stateCode === "US_TX" && (
          <StyledInfoButton>
            <TooltipTrigger contents="Note: Phase information may be inaccurate if referral and attendance details are not up-to-date in OIMS. Click here for a guide on how to enter referral details in OIMS so that the most accurate phases appear in this tool.">
              <InfoButton
                infoUrl={
                  "https://docs.google.com/document/d/e/2PACX-1vQamrgWtwG-kUfm6sBTRjRCYlFAZmMUQRHvoZ-fLU_YO0YfEElrVG7Rgq9NFdIq-NbcD_aILsZvWT2Z/pub#h.ptv2xvkqdjv2"
                }
              />
            </TooltipTrigger>
          </StyledInfoButton>
        )}
    </>
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
      <EmptyStateWrapper>
        <EmptyStateText>{presenter.emptyTabText}</EmptyStateText>
        <EmptyStateText>
          If you think this is inaccurate, please contact support at{" "}
          <Link to={"mailto:feedback@recidiviz.org"}>
            feedback@recidiviz.org
          </Link>
          .
        </EmptyStateText>
      </EmptyStateWrapper>
    </MaxWidthFlexWrapper>
  );
};

const getColumnDefs = (presenter: CaseloadTasksPresenterV2) =>
  [
    {
      header: "Name",
      id: "name",
      accessorFn: (task: SupervisionTask) => task.person.displayName,
      enableSorting: true,
      sortingFn: "text",
      cell: PersonNameCell,
    },
    {
      header: presenter.displayIdHeader,
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
      header: "Due",
      id: "dueDate",
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
      accessorFn: (task) => {
        const person = task.person as Client;
        return person.caseType;
      },
      cell: CaseTypeCell,
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
    {
      header: "City",
      id: "city",
      enableSorting: true,
      accessorFn: ({ person }) => {
        if (person instanceof Client) {
          const { addressCity } =
            person.currentPhysicalResidenceAddressStructured ?? {};
          return (addressCity && toTitleCase(addressCity)) || "—";
        }
      },
    },
    {
      header: "ZIP",
      id: "zip",
      enableSorting: true,
      accessorFn: ({ person }) => {
        if (person instanceof Client) {
          return (
            person.currentPhysicalResidenceAddressStructured?.addressZip ?? "—"
          );
        }
      },
    },
    {
      header: "Assigned To",
      id: "assignedTo",
      // Sort by surname if available, full displayed name if not
      accessorFn: ({ person }) =>
        person.assignedStaff?.surname ?? person.assignedStaffFullName,
      enableSorting: true,
      sortingFn: "text",
      cell: OfficerNameCell,
    },
  ] as const satisfies ColumnDef<SupervisionTask>[];

export type TaskTableColumnId = ReturnType<typeof getColumnDefs>[number]["id"];

export const TasksTable = observer(function TasksTable({
  presenter,
}: {
  presenter: CaseloadTasksPresenterV2;
}) {
  if (presenter.orderedTasksForSelectedCategory.length === 0) {
    return <EmptyTasksTabView presenter={presenter} />;
  }

  const columnsById = Object.fromEntries(
    getColumnDefs(presenter).map((col) => [col.id, col]),
  ) as Record<TaskTableColumnId, ColumnDef<SupervisionTask>>;

  const pickColumns = (ids: TaskTableColumnId[]) =>
    ids.map((id) => columnsById[id]);

  const columns = pickColumns(presenter.tasksTableColumns);

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
