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

import { ColumnDef, Row } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components";

import { palette, spacing } from "~design-system";

import { useRootStore } from "../../components/StoreProvider";
import { formatWorkflowsDate } from "../../utils";
import { CaseloadTable, PersonIdCell, PersonNameCell } from "../CaseloadTable";
import { workflowsUrl } from "../views";
import { WorkflowsFilterDropdown } from "../WorkflowsFilters/WorkflowsFilterDropdown";
import { RNABadge, RNAStatus } from "./RNABadge";
import { RNAFilterPresenter } from "./RNAFilterPresenter";
import { RNARowData, RNAStatusList } from "./RNAFilterPresenter";
import { useRNAFilterStore } from "./RNAFilterStoreProvider";

// On this date, we changed from staff-enabled assessments to assessments that people
// automatically gain access to, after a certain date (90 days before their RNA due
// date). Since RNA due dates may be far in the past, we use this date to display when
// someone's assessment was "enabled", rather than the 90-days-prior date.
const RNA_AUTO_ENABLEMENT_DATE = new Date(2026, 3, 9);

const ViewResults = styled.div`
  border-radius: ${rem(spacing.xs)};
  padding: ${rem(spacing.md)} ${rem(spacing.xs)};
  width: fit-content;
  color: ${palette.pine1};

  display: flex;
  gap: ${rem(spacing.sm)};

  &:hover {
    background-color: ${palette.slate05};
  }
`;

const NameCellWrapper = ({ row }: { row: Row<RNARowData> }) => (
  <PersonNameCell person={row.original.person} />
);

const IdCellWrapper = ({ row }: { row: Row<RNARowData> }) => (
  <PersonIdCell person={row.original.person} />
);

const FormattedRNADueDate = ({ row }: { row: Row<RNARowData> }) => {
  return formatWorkflowsDate(row.original.rnaDueDate);
};

const StatusBadgeCell = ({ row }: { row: Row<RNARowData> }) => {
  return <RNABadge kind={row.original.status} />;
};

const LastUpdatedCell = ({ row }: { row: Row<RNARowData> }) => {
  const { status } = row.original;

  if (status === "COMPLETE") {
    return `Ready since ${formatWorkflowsDate(row.original.completedAt)}`;
  } else if (status === "IN_PROGRESS") {
    return formatWorkflowsDate(row.original.updatedAt);
  } else if (status === "NOT_STARTED") {
    const enablementDate =
      row.original.enabledAt < RNA_AUTO_ENABLEMENT_DATE
        ? RNA_AUTO_ENABLEMENT_DATE
        : row.original.enabledAt;

    return `Enabled since ${formatWorkflowsDate(enablementDate)}`;
  } else if (status === "SUBMITTED_BY_STAFF") {
    return `Submitted ${formatWorkflowsDate(row.original.submittedByStaffAt)}`;
  } else {
    return "–";
  }
};

const ViewResultsCell = ({ row }: { row: Row<RNARowData> }) => {
  const { status } = row.original;
  if (!["COMPLETE", "SUBMITTED_BY_STAFF", "IN_PROGRESS"].includes(status)) {
    return null;
  }
  return (
    <Link
      to={workflowsUrl("rnaSingleResidentResults", {
        justiceInvolvedPersonId: row.original.person.pseudonymizedId,
      })}
    >
      <ViewResults>
        <span>View results </span>
        <i className="fa fa-angle-right" />
      </ViewResults>
    </Link>
  );
};

const rnaStatusOrder: RNAStatus[] = [
  "UPCOMING",
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETE",
  "SUBMITTED_BY_STAFF",
];

const columns = [
  {
    header: "Name",
    id: "name",
    accessorFn: (r: RNARowData) => r.person.displayName,
    enableSorting: true,
    sortingFn: "text",
    cell: NameCellWrapper,
  },
  {
    header: "OPUS ID",
    id: "id",
    accessorFn: (r: RNARowData) => r.person.displayId,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: IdCellWrapper,
  },
  {
    header: "Assigned Case Manager",
    id: "caseManager",
    enableSorting: true,
    sortingFn: "text",
    accessorFn: (r: RNARowData) =>
      r.person.assignedStaff ? r.person.assignedStaffFullName : "Unknown",
  },
  {
    header: "Self-Report Due Date",
    id: "dueDate",
    accessorFn: (r: RNARowData) => r.rnaDueDate,
    enableSorting: true,
    sortingFn: "datetime",
    cell: FormattedRNADueDate,
  },
  {
    header: "Self-Report Status",
    id: "status",
    accessorFn: (r: RNARowData) => r.status,
    enableSorting: true,
    sortingFn: (rowA: Row<RNARowData>, rowB: Row<RNARowData>) => {
      const statusA = rnaStatusOrder.indexOf(rowA.original.status);
      const statusB = rnaStatusOrder.indexOf(rowB.original.status);
      if (statusA === statusB) {
        return 0;
      } else if (statusB > statusA) {
        return 1;
      } else {
        return -1;
      }
    },
    cell: StatusBadgeCell,
  },
  {
    header: "Last Updated",
    id: "lastUpdated",
    accessorFn: (r: RNARowData) =>
      r.submittedByStaffAt ?? r.completedAt ?? r.updatedAt,
    enableSorting: true,
    sortingFn: "datetime",
    cell: LastUpdatedCell,
  },
  {
    header: "",
    id: "viewResults",
    cell: ViewResultsCell,
  },
] satisfies ColumnDef<RNARowData>[];

export const RNATable = observer(function RNATable({
  data,
}: {
  data: RNAStatusList;
}) {
  const { workflowsStore } = useRootStore();
  const rnaFilterStore = useRNAFilterStore();
  const presenter = new RNAFilterPresenter(
    data,
    rnaFilterStore,
    workflowsStore,
  );

  return (
    <>
      <WorkflowsFilterDropdown presenter={presenter} alignedWithLeft={true} />
      <CaseloadTable
        expandedLastColumn={true}
        data={presenter.filteredQueryData}
        columns={columns}
        initialState={{
          sorting: [
            { id: "status", desc: false },
            { id: "dueDate", desc: false },
          ],
        }}
        enableProgressiveLoading={true}
        progressiveLoadingBatchSize={50}
      />
    </>
  );
});
