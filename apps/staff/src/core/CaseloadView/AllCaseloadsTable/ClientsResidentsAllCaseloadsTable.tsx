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
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { JusticeInvolvedPerson } from "../../../WorkflowsStore";
import { AllCaseloadsPresenter } from "../../../WorkflowsStore/presenters/AllCaseloadsPresenter";
import { getPersonReleaseDate } from "../../../WorkflowsStore/utils";
import { CaseloadTable, SupervisingOfficerNameCell } from "../../CaseloadTable";
import { usMiResidentLock, usMiResidentSegregationType } from "./US_MI/utils";
import {
  ClientsResidentsTableColumnId,
  clientSupervisionType,
  nameSortValue,
  PersonDateCell,
  PersonIdCellWrapper,
  personLevel,
  PersonNameWrapper,
  sortDisplayIds,
  sortOptionalDates,
} from "./utils";

type CaseloadRowProps = { row: Row<JusticeInvolvedPerson> };

function AssignedToCell({
  row,
  staffTitle,
}: CaseloadRowProps & { staffTitle: string }) {
  return (
    <SupervisingOfficerNameCell person={row.original} staffTitle={staffTitle} />
  );
}

function TextCell({ getValue }: { getValue: () => unknown }) {
  return String(getValue() || "Unknown");
}

type ClientsResidentsColumnDef = ColumnDef<JusticeInvolvedPerson> & {
  id: ClientsResidentsTableColumnId;
};

function buildColumns({
  assignedStaffTitle,
  dateHeader,
  displayIdHeader,
  levelHeader,
}: {
  assignedStaffTitle: string;
  dateHeader: string;
  displayIdHeader: string;
  levelHeader: string;
}): ClientsResidentsColumnDef[] {
  return [
    {
      header: "Name",
      id: "PERSON_NAME",
      accessorFn: nameSortValue,
      enableSorting: true,
      sortingFn: "text",
      cell: PersonNameWrapper,
    },
    {
      header: displayIdHeader,
      id: "PERSON_DISPLAY_ID",
      accessorFn: (person) => person.displayId,
      enableSorting: true,
      sortingFn: sortDisplayIds,
      cell: PersonIdCellWrapper,
    },
    {
      header: dateHeader,
      id: "RELEASE_DATE",
      accessorFn: getPersonReleaseDate,
      enableSorting: true,
      sortingFn: sortOptionalDates,
      cell: PersonDateCell,
    },
    {
      header: "Assigned To",
      id: "ASSIGNED_STAFF_NAME",
      accessorFn: (person) =>
        person.assignedStaffFullName || person.assignedStaffId,
      enableSorting: true,
      sortingFn: "text",
      cell: ({ row }) => (
        <AssignedToCell row={row} staffTitle={assignedStaffTitle} />
      ),
    },
    {
      header: "Supervision Type",
      id: "CLIENT_SUPERVISION_TYPE",
      accessorFn: clientSupervisionType,
      enableSorting: true,
      sortingFn: "text",
      cell: TextCell,
    },
    {
      header: levelHeader,
      id: "LEVEL",
      accessorFn: personLevel,
      enableSorting: true,
      sortingFn: "text",
      cell: TextCell,
    },
    {
      header: "Lock",
      id: "US_MI_RESIDENT_LOCK",
      accessorFn: usMiResidentLock,
      enableSorting: true,
      sortingFn: "text",
      cell: TextCell,
    },
    {
      header: "Segregation Type",
      id: "US_MI_RESIDENT_SEG_TYPE",
      accessorFn: usMiResidentSegregationType,
      enableSorting: true,
      sortingFn: "text",
      cell: TextCell,
    },
  ];
}

export const ClientsResidentsAllCaseloadsTable = observer(
  function ClientsResidentsAllCaseloadsTable({
    presenter,
  }: {
    presenter: AllCaseloadsPresenter;
  }) {
    const navigate = useNavigate();

    const {
      assignedStaffTitle,
      dateHeader,
      displayIdHeader,
      enabledColumnIds,
      levelHeader,
    } = presenter;
    const columns = useMemo(
      () =>
        buildColumns({
          assignedStaffTitle,
          dateHeader,
          displayIdHeader,
          levelHeader,
        }).filter((col) => enabledColumnIds[col.id]),
      [
        assignedStaffTitle,
        dateHeader,
        displayIdHeader,
        levelHeader,
        enabledColumnIds,
      ],
    );

    return (
      <CaseloadTable
        data={presenter.people}
        columns={columns}
        onRowClick={(person) => navigate(person.profileUrl)}
        initialState={{
          sorting: [{ id: "PERSON_NAME", desc: false }],
        }}
      />
    );
  },
);
