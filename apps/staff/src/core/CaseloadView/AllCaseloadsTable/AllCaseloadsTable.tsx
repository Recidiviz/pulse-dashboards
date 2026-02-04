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

import { ColumnDef } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";

import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../../components/StoreProvider";
import { NavigateToFormButtonStyle } from "../../../WorkflowsStore/Opportunity/Forms/NavigateToFormButton";
import { Resident } from "../../../WorkflowsStore/Resident";
import {
  CaseloadTable,
  PersonIdCell,
  PersonNameCell,
  ReleaseDateCell,
} from "../../CaseloadTable";
import { FacilityUnitIdCell } from "../../CaseloadTable/FacilityUnitIdCell";
import ModelHydrator from "../../ModelHydrator";
import { OPPORTUNITY_STATUS_COLORS } from "../../utils/workflowsUtils";
import {
  AllCaseloadsModalProvider,
  useAllCaseloadsModalContext,
} from "./AllCaseloadsModalContext";
import { AllCaseloadsPreviewModal } from "./AllCaseloadsPreviewModal";
import { AllCaseloadsTablePresenter } from "./AllCaseloadsTablePresenter";
import { CaseloadRowProps } from "./types";
import { usTnOpportunityColumn, usTnStatusColumn } from "./UsTnColumns";

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

function AllFormsButton({ row }: CaseloadRowProps) {
  const { setCurrentView } = useAllCaseloadsModalContext();

  const { workflowsStore } = useRootStore();
  const person = row.original;

  return (
    <div>
      <NavigateToFormButtonStyle
        buttonFill={OPPORTUNITY_STATUS_COLORS.eligible.buttonFill}
        onClick={(event) => {
          setCurrentView("SELECT_FORM");
          workflowsStore.updateSelectedPerson(person.pseudonymizedId);
          event.stopPropagation();
        }}
      >
        Auto-fill paperwork
      </NavigateToFormButtonStyle>
    </div>
  );
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
  usTnStatusColumn,
  usTnOpportunityColumn,
  {
    header: "Facility/Unit",
    id: "facilityUnit",
    accessorFn: (person) => person.combinedFacilityUnitId,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: FacilityUnitItWrapper,
  },
  {
    header: "",
    id: "formButton",
    cell: AllFormsButton,
  },
] satisfies ColumnDef<Resident>[];

function AllCaseloadsTableComponent({
  presenter,
}: {
  presenter: AllCaseloadsTablePresenter;
}) {
  const { setCurrentView } = useAllCaseloadsModalContext();

  return (
    <CaseloadTable
      data={presenter.people}
      columns={columns}
      onRowClick={(person) => {
        setCurrentView("OVERVIEW");
        presenter.updateSelectedPerson(person);
      }}
      shouldHighlightRow={(person) =>
        presenter.selectedResident?.pseudonymizedId === person.pseudonymizedId
      }
    />
  );
}

const ManagedComponent = observer(function AllCaseloadsTable({
  presenter,
}: {
  presenter: AllCaseloadsTablePresenter;
}) {
  if (!presenter.canRenderTable) return;

  return (
    <AllCaseloadsModalProvider>
      <ModelHydrator hydratable={presenter}>
        <AllCaseloadsTableComponent presenter={presenter} />
        <AllCaseloadsPreviewModal presenter={presenter} />
      </ModelHydrator>
    </AllCaseloadsModalProvider>
  );
});

function usePresenter() {
  const rootStore = useRootStore();

  return new AllCaseloadsTablePresenter(rootStore);
}

export const AllCaseloadsTable = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
