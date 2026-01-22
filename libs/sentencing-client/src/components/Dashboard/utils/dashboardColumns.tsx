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
import moment from "moment";

import { sortFullNameByLastNameDescending } from "../../../utils/sorting";
import { capitalizeName, displayReportType } from "../../../utils/utils";
import { REPORT_TYPE_KEY } from "../../CaseDetails/constants";
import {
  stripFreeTextHelper,
  UNKNOWN_OPTION,
} from "../../CaseDetails/Form/constants";
import { ReportType } from "../../constants";
import {
  ARCHIVED_STATUS,
  CANCELLED_STATUS,
  CLIENT_FULL_NAME_KEY,
  DUE_DATE_KEY,
  ID_KEY,
  OFFENSE_KEY,
  STATUS_KEY,
} from "../constants";
import * as Styled from "../Dashboard.styles";
import { CaseListTableCase, CaseStatus, CaseStatusToDisplay } from "../types";
import { isBeforeDueDateWithExtraDayOffset } from "../utils";

export const NAME_COLUMN: ColumnDef<CaseListTableCase> = {
  header: "Name",
  accessorKey: CLIENT_FULL_NAME_KEY,
  sortingFn: (rowA: Row<CaseListTableCase>, rowB: Row<CaseListTableCase>) =>
    sortFullNameByLastNameDescending(
      rowA.original.client?.fullName,
      rowB.original.client?.fullName,
    ),
  cell: (info) => {
    const clientName = (info.getValue() as string) ?? "No name found";
    return (
      <div style={{ textTransform: "capitalize" }}>
        {clientName.toLocaleLowerCase()}
      </div>
    );
  },
};

export const ID_COLUMN: ColumnDef<CaseListTableCase> = {
  header: "ID",
  accessorKey: ID_KEY,
  enableSorting: false,
};

export const DUE_DATE_COLUMN: ColumnDef<CaseListTableCase> = {
  header: "Due Date",
  accessorKey: DUE_DATE_KEY,
  cell: (info) => {
    const value = info.getValue() as Date | null;
    return value === null
      ? UNKNOWN_OPTION
      : moment(value).utc().format("MM/DD/YYYY");
  },
};

const createStatusColumn = (header: string): ColumnDef<CaseListTableCase> => ({
  header,
  accessorKey: STATUS_KEY,
  cell: (info) => {
    const statusValue = info.getValue() as CaseStatus;
    // isCancelled only exists on PSI Cases (StaffCase), not SARs (StaffSAR)
    const isCancelledStatus =
      "isCancelled" in info.cell.row.original
        ? info.cell.row.original.isCancelled
        : false;
    const statusOrArchived = isBeforeDueDateWithExtraDayOffset(
      info.cell.row.original.dueDate,
    )
      ? CaseStatusToDisplay[statusValue]
      : ARCHIVED_STATUS;
    const statusToDisplay = isCancelledStatus
      ? CANCELLED_STATUS
      : statusOrArchived;

    return (
      <Styled.StatusChip status={statusToDisplay}>
        {statusToDisplay}
      </Styled.StatusChip>
    );
  },
  sortingFn: (a: Row<CaseListTableCase>, b: Row<CaseListTableCase>) => {
    // Access dueDate and status directly instead of via bracket notation
    // to avoid TypeScript union type issues
    const dueDateStringA = String(a.original.dueDate);
    const dueDateStringB = String(b.original.dueDate);
    const dueDateA = moment.utc(dueDateStringA);
    const dueDateB = moment.utc(dueDateStringB);

    const statusOrder = {
      InProgress: 0,
      NotYetStarted: 1,
      Complete: 2,
    };

    const isArchivedA = !a.original.dueDate || moment.utc().isAfter(dueDateA);
    const isArchivedB = !b.original.dueDate || moment.utc().isAfter(dueDateB);

    // If both are archived, return 0
    if (isArchivedA && isArchivedB) {
      return 0;
    }

    // If A is archived and B is not, put A at the bottom of the list
    if (isArchivedA) {
      return 1;
    }

    // If B is archived and A is not, put B at the bottom of the list
    if (isArchivedB) {
      return -1;
    }

    // Sort by status
    const caseStatusA = a.original.status as CaseStatus;
    const caseStatusB = b.original.status as CaseStatus;
    const statusComparison =
      caseStatusA &&
      caseStatusB &&
      statusOrder[caseStatusA] - statusOrder[caseStatusB];

    return statusComparison ?? 0;
  },
});

export const PSI_STATUS_COLUMN = createStatusColumn("Recommendation Status");
export const SAR_STATUS_COLUMN = createStatusColumn("Status");

export const ASSIGNED_TO_COLUMN: ColumnDef<CaseListTableCase> = {
  header: "Assigned To",
  accessorKey: "assignedTo",
  sortingFn: (rowA: Row<CaseListTableCase>, rowB: Row<CaseListTableCase>) => {
    const nameA =
      "assignedTo" in rowA.original ? rowA.original.assignedTo : undefined;
    const nameB =
      "assignedTo" in rowB.original ? rowB.original.assignedTo : undefined;

    // Put blank/undefined values at the top (supervisor's own cases)
    if (!nameA && !nameB) return 0;
    if (!nameA) return -1;
    if (!nameB) return 1;

    return sortFullNameByLastNameDescending(nameA, nameB);
  },
  cell: (info) => {
    const assignedTo = info.getValue() as string | undefined;
    // Show name if assigned to someone else, blank if it's the supervisor's own case
    return assignedTo ? capitalizeName(assignedTo) : "";
  },
};

export const SAR_DASHBOARD_COLUMNS: ColumnDef<CaseListTableCase>[] = [
  NAME_COLUMN,
  ID_COLUMN,
  DUE_DATE_COLUMN,
  SAR_STATUS_COLUMN,
];

export const PSI_DASHBOARD_COLUMNS: ColumnDef<CaseListTableCase>[] = [
  NAME_COLUMN,
  ID_COLUMN,
  DUE_DATE_COLUMN,
  {
    header: "Report Type",
    accessorKey: REPORT_TYPE_KEY,
    cell: (info) => {
      const value = info.getValue() as keyof typeof ReportType;
      return displayReportType(value);
    },
  },
  {
    header: "Offense",
    accessorKey: OFFENSE_KEY,
    cell: (info) => {
      const displayValue =
        stripFreeTextHelper(info.getValue() as string | undefined) ??
        "None Yet";
      return (
        <Styled.Offense isNotSpecified={displayValue === "None Yet"}>
          {displayValue}
        </Styled.Offense>
      );
    },
  },
  PSI_STATUS_COLUMN,
];
