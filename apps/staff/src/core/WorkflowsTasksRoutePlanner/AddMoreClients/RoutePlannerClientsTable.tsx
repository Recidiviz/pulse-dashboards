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

import { palette } from "~design-system";
import useIsMobile from "~utils/react/useIsMobile";

import { Client } from "../../../WorkflowsStore";
import { CaseloadTable } from "../../CaseloadTable/CaseloadTable";
import { PersonNameElement } from "../../CaseloadTable/PersonNameCell";
import { SupervisingOfficerNameCell } from "../../CaseloadTable/SupervisingOfficerNameCell";
import {
  TextCell,
  TextCellObservable,
} from "../../CaseloadView/AllCaseloadsTable/ClientsResidentsAllCaseloadsTable";
import {
  CaseloadPersonRowProps,
  clientSupervisionType,
  nameSortValue,
  PersonIdCellWrapper,
  personLevel,
} from "../../CaseloadView/AllCaseloadsTable/utils";
import {
  CheckboxContents,
  EmptyCheckbox,
  NumberedCheckbox,
} from "../RoutePlannerClientCard";
import {
  RoutePlannerTablePresenter,
  TableColumnId,
} from "./RoutePlannerTablePresenter";

type CaseloadRowProps = { row: Row<Client> };

function AssignedToCell({ row }: CaseloadRowProps) {
  return (
    <SupervisingOfficerNameCell
      person={row.original}
      staffTitle={"supervisor"}
    />
  );
}

function AddressCell({ row }: { row: Client }) {
  return (
    <div
      style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
    >
      {row.formattedAddress}
      <div style={{ color: palette.slate50 }}></div>
    </div>
  );
}

function CheckBoxWrapper({
  row,
  isSelected,
  rank,
}: {
  row: Row<Client>;
  isSelected: (person: Client) => boolean;
  rank: (person: Client) => number;
}) {
  if (!isSelected(row.original)) return <EmptyCheckbox $selectable={true} />;
  else
    return (
      <NumberedCheckbox>
        <CheckboxContents>{rank(row.original)}</CheckboxContents>
      </NumberedCheckbox>
    );
}

export function PersonNameWrapper<Person extends Client>({
  row,
}: CaseloadPersonRowProps<Person>) {
  return <PersonNameCell person={row.original} />;
}

export const PersonNameCell = observer(function PersonNameCell({
  person,
}: {
  person: Client;
}) {
  const { isMobile } = useIsMobile(true);
  // In TX, all JII are displayed with last name first.
  const shouldDisplayNameLastFirst = person.stateCode === "US_TX";
  const displayName = shouldDisplayNameLastFirst
    ? person.displayPreferredNameLastFirst
    : person.displayPreferredName;
  return (
    <PersonNameElement
      $isMobile={isMobile}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        textWrap: "wrap",
        gap: "0rem",
        padding: "2px 0",
      }}
    >
      <div>{displayName}</div>
    </PersonNameElement>
  );
});

type ClientsResidentsColumnDef = ColumnDef<Client> & {
  id: TableColumnId;
};

function buildColumns({
  displayIdHeader,
  isSelected,
  getCardinal,
}: {
  displayIdHeader: string;
  isSelected: (person: Client) => boolean;
  getCardinal: (person: Client) => number;
}): ClientsResidentsColumnDef[] {
  return [
    {
      header: "",
      id: "SELECTED",
      accessorFn: (row) => isSelected(row),
      enableSorting: true,
      sortingFn: (a, b) => {
        return Number(isSelected(b.original)) - Number(isSelected(a.original));
      },
      cell: ({ row }) => (
        <CheckBoxWrapper rank={getCardinal} row={row} isSelected={isSelected} />
      ),
    },
    {
      header: "Name",
      id: "PERSON_NAME",
      accessorFn: nameSortValue,
      enableSorting: true,
      sortingFn: "text",
      cell: ({ row }) => <PersonNameWrapper row={row} />,
    },
    {
      header: displayIdHeader,
      id: "PERSON_DISPLAY_ID",
      accessorFn: (person) => person.displayId,
      enableSorting: true,
      sortingFn: "alphanumeric",
      cell: PersonIdCellWrapper,
    },
    {
      header: "Assigned To",
      id: "ASSIGNED_STAFF_NAME",
      accessorFn: (person) =>
        person.assignedStaffFullName || person.assignedStaffId,
      enableSorting: true,
      sortingFn: "text",
      cell: ({ row }) => <AssignedToCell row={row} />,
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
      header: "Supervision Level",
      id: "LEVEL",
      accessorFn: personLevel,
      enableSorting: true,
      sortingFn: "text",
      cell: TextCellObservable,
    },
    {
      header: "Address",
      id: "ADDRESS",
      accessorFn: (person) => {
        if (person instanceof Client) return person.formattedAddress;
      },
      enableSorting: true,
      sortingFn: "text",
      cell: ({ row }) => <AddressCell row={row.original} />,
    },
  ];
}

export const RoutePlannerTable = observer(function RoutePlannerTable({
  presenter,
}: {
  presenter: RoutePlannerTablePresenter;
}) {
  const { displayIdHeader, isSelected, getCardinal } = presenter;
  const columns = useMemo(
    () =>
      buildColumns({
        displayIdHeader,
        isSelected,
        getCardinal,
      }),
    [displayIdHeader, isSelected, getCardinal],
  );
  return (
    <CaseloadTable
      shouldHighlightRow={(e) => presenter.isSelected(e)}
      onRowClick={(e) => {
        presenter.updateSelected(e);
      }}
      data={presenter.people}
      columns={columns}
      enableProgressiveLoading={true}
      progressiveLoadingBatchSize={100}
      smallColumns={true}
    />
  );
});
