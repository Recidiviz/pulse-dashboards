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
import styled from "styled-components";

import { palette, TooltipTrigger } from "~design-system";
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
import { InfoButton } from "../../WorkflowsJusticeInvolvedPersonProfile/InfoButton";
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

const NotAllowedCell = styled.div`
  color: ${palette.slate60};
  font-size: 11px;
`;

const PersonNameElementWrapper = styled(PersonNameElement)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-wrap: wrap;
  gap: 0em;
  padding: 2px 0;
`;

function AssignedToCell({ row }: CaseloadRowProps) {
  return (
    <SupervisingOfficerNameCell
      person={row.original}
      staffTitle={"supervisor"}
    />
  );
}

function AddressCell({
  row,
  isBadAddress,
  contents,
}: {
  row: Client;
  isBadAddress: (person: Client) => boolean;
  contents: () => string;
}) {
  return (
    <div
      style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
    >
      {row.formattedAddress}
      <div style={{ color: palette.slate50 }}>
        {isBadAddress(row) && (
          <TooltipTrigger contents={contents()} maxWidth={340}>
            <InfoButton infoUrl={undefined} />
          </TooltipTrigger>
        )}
      </div>
    </div>
  );
}

function CheckBoxWrapper({
  row,
  isSelected,
  rank,
  isBadAddress,
  isAlreadyPresent,
}: {
  row: Row<Client>;
  isSelected: (person: Client) => boolean;
  rank: (person: Client) => number;
  isBadAddress: (person: Client) => boolean;
  isAlreadyPresent: (person: Client) => boolean;
}) {
  if (isBadAddress(row.original)) {
    return (
      <EmptyCheckbox
        $selectable={false}
        style={{ cursor: "not-allowed", background: "rgb(244, 245, 245)" }}
      />
    );
  }
  if (isAlreadyPresent(row.original))
    return (
      <EmptyCheckbox $selectable={false} style={{ cursor: "not-allowed" }} />
    );
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
  isBadAddress,
  isAlreadyPresent,
}: CaseloadPersonRowProps<Person> & {
  isBadAddress: (person: Client) => boolean;
  isAlreadyPresent: (person: Client) => boolean;
}) {
  return (
    <PersonNameCell
      person={row.original}
      isBadAddress={isBadAddress}
      isAlreadyPresent={isAlreadyPresent}
    />
  );
}

export const PersonNameCell = observer(function PersonNameCell({
  person,
  isBadAddress,
  isAlreadyPresent,
}: {
  person: Client;
  isBadAddress: (person: Client) => boolean;
  isAlreadyPresent: (person: Client) => boolean;
}) {
  const { isMobile } = useIsMobile(true);
  // In TX, all JII are displayed with last name first.
  const shouldDisplayNameLastFirst = person.stateCode === "US_TX";
  const displayName = shouldDisplayNameLastFirst
    ? person.displayPreferredNameLastFirst
    : person.displayPreferredName;
  return (
    <PersonNameElementWrapper $isMobile={isMobile}>
      <div>{displayName}</div>
      {isBadAddress(person) && (
        <NotAllowedCell>{"Address not found"}</NotAllowedCell>
      )}
      {isAlreadyPresent(person) && (
        <NotAllowedCell>{"Already shown in your planner"}</NotAllowedCell>
      )}
    </PersonNameElementWrapper>
  );
});

type ClientsResidentsColumnDef = ColumnDef<Client> & {
  id: TableColumnId;
};

function buildColumns({
  displayIdHeader,
  isSelected,
  getCardinal,
  isBadAddress,
  isAlreadyPresent,
  getBadAddressCopy,
}: {
  displayIdHeader: string;
  isSelected: (person: Client) => boolean;
  getCardinal: (person: Client) => number;
  isBadAddress: (person: Client) => boolean;
  isAlreadyPresent: (person: Client) => boolean;
  getBadAddressCopy: () => string;
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
        <CheckBoxWrapper
          rank={getCardinal}
          row={row}
          isSelected={isSelected}
          isBadAddress={isBadAddress}
          isAlreadyPresent={isAlreadyPresent}
        />
      ),
    },
    {
      header: "Name",
      id: "PERSON_NAME",
      accessorFn: nameSortValue,
      enableSorting: true,
      sortingFn: "text",
      cell: ({ row }) => (
        <PersonNameWrapper
          row={row}
          isBadAddress={isBadAddress}
          isAlreadyPresent={isAlreadyPresent}
        />
      ),
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
      cell: ({ row }) => (
        <AddressCell
          row={row.original}
          isBadAddress={isBadAddress}
          contents={getBadAddressCopy}
        />
      ),
    },
  ];
}

export const RoutePlannerTable = observer(function RoutePlannerTable({
  presenter,
}: {
  presenter: RoutePlannerTablePresenter;
}) {
  const {
    displayIdHeader,
    isSelected,
    getCardinal,
    isBadAddress,
    isAlreadyPresent,
    getBadAddressCopy,
  } = presenter;
  const columns = useMemo(
    () =>
      buildColumns({
        displayIdHeader,
        isSelected,
        getCardinal,
        isBadAddress,
        isAlreadyPresent,
        getBadAddressCopy,
      }),
    [
      displayIdHeader,
      isSelected,
      getCardinal,
      isBadAddress,
      isAlreadyPresent,
      getBadAddressCopy,
    ],
  );
  return (
    <CaseloadTable
      shouldHighlightRow={(e) => presenter.isSelected(e)}
      onRowClick={(e) => {
        if (presenter.isBadAddress(e) || presenter.isAlreadyPresent(e)) return;
        presenter.updateSelected(e);
      }}
      data={presenter.people}
      columns={columns}
      shouldBlockSelectingRow={(e) =>
        presenter.isBadAddress(e) || presenter.isAlreadyPresent(e)
      }
      enableProgressiveLoading={true}
      progressiveLoadingBatchSize={100}
      smallColumns={true}
    />
  );
});
