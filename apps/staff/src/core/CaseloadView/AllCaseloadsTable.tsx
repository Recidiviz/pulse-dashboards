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

import { useRootStore } from "../../components/StoreProvider";
import { Resident } from "../../WorkflowsStore/Resident";
import {
  CaseloadTable,
  PersonIdCell,
  PersonNameCell,
  ReleaseDateCell,
} from "../CaseloadTable";
import { FacilityUnitIdCell } from "../CaseloadTable/FacilityUnitIdCell";
import { AllCaseloadsPreviewModal } from "./AllCaseloadsPreviewModal";

type CaseloadRowProps = { row: Row<Resident> };

function PersonNameWrapper({ row }: CaseloadRowProps) {
  return <PersonNameCell person={row.original} />;
}

function PersonIdCellWrapper({ row }: CaseloadRowProps) {
  return <PersonIdCell person={row.original} />;
}

function ReleaseDateWrapper({ row }: CaseloadRowProps) {
  return <ReleaseDateCell person={row.original} />;
}

function FacilityUnitItWrapper({ row }: CaseloadRowProps) {
  return <FacilityUnitIdCell person={row.original} />;
}

const columns = [
  {
    header: "Name",
    id: "name",
    accessorFn: (person) => person.displayName,
    enableSorting: true,
    sortingFn: "text",
    cell: PersonNameWrapper,
  },
  {
    header: "ID",
    id: "id",
    accessorFn: (person) => person.displayId,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: PersonIdCellWrapper,
  },
  {
    header: "Release Date",
    id: "releaseDate",
    accessorFn: (person) => person.releaseDate,
    enableSorting: true,
    sortingFn: "datetime",
    cell: ReleaseDateWrapper,
  },
  {
    header: "Facility/Unit",
    id: "facilityUnit",
    accessorFn: (person) => person.combinedFacilityUnitId,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: FacilityUnitItWrapper,
  },
] satisfies ColumnDef<Resident>[];

export const AllCaseloadsTable = observer(function AllCaseloadsTable() {
  const {
    workflowsStore,
    workflowsStore: {
      searchStore: { caseloadPersons },
      activeSystem,
    },
  } = useRootStore();

  // This table only supports residents for now
  if (activeSystem !== "INCARCERATION") return;

  return (
    <>
      <CaseloadTable
        // @ts-expect-error the activeSystem check ensures these are Residents
        data={caseloadPersons}
        columns={columns}
        onRowClick={(person) => {
          workflowsStore.updateSelectedPerson(person.pseudonymizedId);
        }}
        shouldHighlightRow={() => false}
      />
      <AllCaseloadsPreviewModal />
    </>
  );
});
