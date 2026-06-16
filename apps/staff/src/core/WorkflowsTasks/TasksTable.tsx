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

import { TooltipTrigger } from "@recidiviz/design-system";
import { ColumnDef, Row } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import pluralize from "pluralize";
import { rem } from "polished";
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

import { Icon, palette } from "~design-system";

import {
  formatDueDateFromToday,
  formatWorkflowsDate,
  formatWorkflowsDateWithoutYear,
  toTitleCase,
} from "../../utils";
import { Client, JusticeInvolvedPerson } from "../../WorkflowsStore";
import { TasksRowEntity } from "../../WorkflowsStore/Task/types";
import {
  CaseloadTable,
  PersonIdCell,
  PersonNameCell,
  SupervisingOfficerNameCell,
} from "../CaseloadTable";
import {
  EmptyStateText,
  EmptyStateWrapper,
  MaxWidthFlexWrapper,
} from "../OpportunityCaseloadView/HydratedOpportunityPersonList";
import { InfoButton } from "../WorkflowsJusticeInvolvedPersonProfile/InfoButton";
import { SupervisionTaskCategory } from "./fixtures";
import { TaskFrequency } from "./TaskFrequency";

const StyledInfoButton = styled.span`
  color: ${palette.slate60};
`;

const mainTaskForEntity = (entity: TasksRowEntity) =>
  "tasks" in entity ? entity.tasks[0] : entity;

function PersonNameCellWrapper({ row }: { row: Row<TasksRowEntity> }) {
  const { person } = row.original;
  return <PersonNameCell person={person} />;
}

function OfficerNameCell({ row }: { row: Row<TasksRowEntity> }) {
  return <SupervisingOfficerNameCell person={row.original.person} />;
}

function PersonIdCellWrapper({ row }: { row: Row<TasksRowEntity> }) {
  const { person } = row.original;
  return <PersonIdCell person={person} />;
}

// Supports links to policy documents in the Case Type cell for special programs in Texas.
// If we need to update/expand to more states, consider refactoring this to make it more sustainable
function policyLinkForCaseType({
  caseType,
  stateCode,
}: Client): string | undefined {
  if (stateCode !== "US_TX") return;

  // TC ("therapeutic community")
  if (caseType.toLowerCase().startsWith("substance abuse")) {
    return "https://www.tdcj.texas.gov/documents/pd/03.08.01_parole_policy.pdf";
  }
  switch (caseType) {
    // SNOP ("special needs offender program")
    case "Mentally ill":
    case "Intellectually disabled":
    case "Terminally ill / Physically handicapped":
      return "https://www.tdcj.texas.gov/documents/pd/03.07.01_parole_policy.pdf";
    // SISP ("super-intensive supervision")
    case "Super-intensive supervision":
      return "https://www.tdcj.texas.gov/documents/pd/03.15.01_parole_policy.pdf";
    default:
      return;
  }
}

function CaseTypeCell({ row }: { row: Row<TasksRowEntity> }) {
  const { person } = row.original;
  const { caseType, stateCode } = person as Client;

  const link = policyLinkForCaseType(person as Client);

  return (
    <>
      {caseType}
      {link && (
        <>
          {" "}
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <TooltipTrigger contents="Click to read TDCJ policy relating to this case type.">
              <Icon kind="Open" size={12} />
            </TooltipTrigger>
          </a>
        </>
      )}
      {caseType.toLowerCase().startsWith("substance abuse") &&
        stateCode === "US_TX" && (
          <>
            {" "}
            <StyledInfoButton>
              <TooltipTrigger contents="Note: Phase information may be inaccurate if referral and attendance details are not up-to-date in OIMS. Click here for a guide on how to enter referral details in OIMS so that the most accurate phases appear in this tool.">
                <InfoButton
                  infoUrl={
                    "https://docs.google.com/document/d/e/2PACX-1vQamrgWtwG-kUfm6sBTRjRCYlFAZmMUQRHvoZ-fLU_YO0YfEElrVG7Rgq9NFdIq-NbcD_aILsZvWT2Z/pub#h.ptv2xvkqdjv2"
                  }
                />
              </TooltipTrigger>
            </StyledInfoButton>
          </>
        )}
    </>
  );
}

const KeepTogether = styled.span`
  white-space: nowrap;
`;

const MoreSuffix = styled.span`
  color: ${palette.slate60};
  margin-left: ${rem(8)};
`;

function tasksForEntity(entity: TasksRowEntity) {
  return "tasks" in entity ? entity.tasks : [entity];
}

function TasksCell({ row }: { row: Row<TasksRowEntity> }) {
  const tasks = tasksForEntity(row.original);
  if (tasks.length === 0) return <>None</>;
  const first = tasks[0];
  const rest = tasks.length - 1;
  return (
    <>
      {`${first.displayName} due ${formatDueDateFromToday(first.dueDate)}`}
      {rest > 0 && <MoreSuffix>+{rest} more</MoreSuffix>}
    </>
  );
}

function TaskNameCell({ row }: { row: Row<TasksRowEntity> }) {
  const entity = row.original;

  const tasks = "tasks" in entity ? entity.tasks : [entity];

  if (tasks.length === 0) return "-";
  if (tasks.length === 1) return tasks[0].displayName;
  if (tasks.length === 2)
    return `${tasks[0].displayName} and ${tasks[1].displayName}`;
  return `${tasks[0].displayName} and ${tasks.length - 1} others`;
}

function TaskDateCell({ row }: { row: Row<TasksRowEntity> }) {
  const { dueDate } = mainTaskForEntity(row.original);

  return (
    <>
      {formatWorkflowsDate(dueDate)}{" "}
      <KeepTogether>{`(${formatDueDateFromToday(dueDate)})`}</KeepTogether>
    </>
  );
}

function FrequencyCell({ row }: { row: Row<TasksRowEntity> }) {
  const task = mainTaskForEntity(row.original);

  return <TaskFrequency task={task} />;
}

/**
 * The presenter surface `TasksTable` (and its empty/column helpers) depend on.
 * Both `CaseloadTasksPresenterV2` (legacy Tasks page) and `MyCaseloadPresenter`
 * implement it, so the table can back either view without coupling to a
 * concrete presenter.
 */
export interface TasksTablePresenter {
  emptyTabText: string | undefined;
  displayIdHeader: string;
  showOneRowPerClient: boolean;
  tasksTableColumns: TaskTableColumnId[];
  rowEntitiesForSelectedCategory: TasksRowEntity[];
  selectedTaskCategory: SupervisionTaskCategory;
  selectPerson(person: JusticeInvolvedPerson): void;
  shouldHighlightRow(entity: TasksRowEntity): boolean;
}

export const EmptyTasksTabView = ({
  presenter,
}: {
  presenter: TasksTablePresenter;
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

// Narrow param (not the full `TasksTablePresenter`) on purpose: `TaskTableColumnId`
// is derived from `ReturnType<typeof getColumnDefs>`, and `TasksTablePresenter`
// references `TaskTableColumnId` — annotating with the full interface here would
// make the column-id type circular.
const getColumnDefs = (presenter: {
  displayIdHeader: string;
  showOneRowPerClient: boolean;
}) =>
  [
    {
      header: "Name",
      id: "name",
      accessorFn: (entity: TasksRowEntity) => {
        return entity.person.displayName;
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        if (rowA.original.person.stateCode === "US_TX") {
          const lastB = rowB.original.person.displayName.split(" ")[1];
          const lastA = rowA.original.person.displayName.split(" ")[1];
          return lastA < lastB ? 1 : -1;
        }
        return rowA.original.person.displayName <
          rowB.original.person.displayName
          ? 1
          : -1;
      },
      cell: PersonNameCellWrapper,
    },
    {
      header: presenter.displayIdHeader,
      id: "id",
      accessorKey: "person.displayId",
      enableSorting: true,
      sortingFn: "alphanumeric",
      cell: PersonIdCellWrapper,
    },
    {
      header: presenter.showOneRowPerClient ? "Tasks" : "Task",
      id: "task",
      accessorFn: (entity) => {
        // For ClientTasksSummary, use first task name for sorting
        return mainTaskForEntity(entity).displayName;
      },
      enableSorting: true,
      cell: TaskNameCell,
    },
    {
      header: "Due",
      id: "dueDate",
      enableSorting: true,
      accessorFn: (entity) => mainTaskForEntity(entity).dueDate,
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
      accessorFn: ({ person }) => person.caseType,
      cell: CaseTypeCell,
      enableSorting: true,
    },
    {
      header: "Tasks due",
      id: "tasksDue",
      enableSorting: true,
      accessorFn: ({ person }) => person.supervisionTasks?.tasks.length ?? 0,
    },
    {
      header: "City",
      id: "city",
      enableSorting: true,
      accessorFn: ({ person }) => {
        const { addressCity } =
          person.currentPhysicalResidenceAddressStructured ?? {};
        return (addressCity && toTitleCase(addressCity)) || "—";
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
        person.assignedStaff?.surname ?? person.assignedStaffFullName ?? "",
      enableSorting: true,
      sortingFn: "text",
      cell: OfficerNameCell,
    },
    {
      header: "Tasks",
      id: "tasks",
      enableSorting: true,
      // Sort by the earliest due date so the most-urgent rows surface to the
      // top on first sort. Zero-task rows are pushed to the bottom by mapping
      // their absent date to MAX_SAFE_INTEGER.
      sortDescFirst: false,
      sortingFn: "basic",
      accessorFn: (entity) => {
        const tasks = "tasks" in entity ? entity.tasks : [entity];
        return tasks[0]?.dueDate.getTime() ?? Number.MAX_SAFE_INTEGER;
      },
      cell: TasksCell,
    },
    {
      header: "Appointment Status",
      id: "appointmentStatus",
      accessorFn: (entity) => {
        const task = mainTaskForEntity(entity);
        // Custom tasks don't carry scheduled-contact metadata — render an
        // em-dash to keep column alignment when a tenant happens to enable
        // both this column and the customTasks flag.
        if (task.type === "customTask") return "–";
        const { futureScheduledContacts, scheduledContactDates } = task;

        if (!scheduledContactDates) {
          return "–";
        }

        if (futureScheduledContacts?.length) {
          // simplur hides the quantity when passed in an array
          const numAppointments = futureScheduledContacts.length;
          const dates = futureScheduledContacts
            .map(formatWorkflowsDateWithoutYear)
            .join(", ");
          return `Upcoming ${pluralize("appointment", numAppointments)}: ${dates}`;
        } else {
          return "Not yet scheduled";
        }
      },
      enableSorting: true,
      sortingFn: "text",
    },
  ] as const satisfies ColumnDef<TasksRowEntity>[];

export type TaskTableColumnId = ReturnType<typeof getColumnDefs>[number]["id"];

export const TasksTable = observer(function TasksTable({
  presenter,
  rowLinkUrl,
  renderEmptyState,
}: {
  presenter: TasksTablePresenter;
  /**
   * Page-level customization: when provided, rows render as anchors pointing
   * to the returned URL and `selectPerson` is NOT called on click (the link
   * navigates to a profile page instead of opening the side-panel modal).
   * Default (Tasks page): omit this prop to keep modal-on-click behaviour.
   */
  rowLinkUrl?: (entity: TasksRowEntity) => string;
  /**
   * Page-level customization of the empty-tab state. Receives the presenter so
   * the consumer can vary copy by `selectedTaskCategory`. Default (Tasks page):
   * omit this prop to keep the standard `EmptyTasksTabView`.
   */
  renderEmptyState?: (presenter: TasksTablePresenter) => ReactNode;
}) {
  // Check if there's data to display
  const hasData = presenter.rowEntitiesForSelectedCategory.length > 0;

  if (!hasData) {
    return (
      <>
        {renderEmptyState ? (
          renderEmptyState(presenter)
        ) : (
          <EmptyTasksTabView presenter={presenter} />
        )}
      </>
    );
  }

  const columnsById = Object.fromEntries(
    getColumnDefs(presenter).map((col) => [col.id, col]),
  ) as Record<TaskTableColumnId, ColumnDef<TasksRowEntity>>;

  const pickColumns = (ids: TaskTableColumnId[]) =>
    ids.map((id) => columnsById[id]);

  const columns = pickColumns(presenter.tasksTableColumns);

  return (
    <CaseloadTable
      expandedLastColumn
      data={presenter.rowEntitiesForSelectedCategory}
      columns={columns}
      // When `rowLinkUrl` is provided the anchor handles navigation; we
      // intentionally skip `onRowClick` so the side-panel modal never opens.
      onRowClick={
        rowLinkUrl
          ? undefined
          : (entity) => {
              presenter.selectPerson(entity.person);
            }
      }
      rowLinkUrl={rowLinkUrl}
      shouldHighlightRow={(entity) => presenter.shouldHighlightRow(entity)}
    />
  );
});
