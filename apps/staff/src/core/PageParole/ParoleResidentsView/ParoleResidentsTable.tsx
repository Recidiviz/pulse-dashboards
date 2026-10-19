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

import { spacing } from "@recidiviz/design-system";
import { ColumnDef, Row } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import useIsMobile from "../../../hooks/useIsMobile";
import {
  ParoleResidentRow,
  ParoleResidentsPresenter,
} from "../../../ParoleStore/presenters/ParoleResidentsPresenter";
import { formatDocId } from "../../../ParoleStore/utils";
import { CaseloadTable, PersonNameElement } from "../../CaseloadTable";
import PersonId from "../../PersonId";
import { paroleUrl } from "../../views";
import {
  SearchIcon,
  SearchInput,
  SearchInputWrapper,
  Summary,
} from "../components/ParoleListTableParts";
import { formatMonth, parseIsoDate } from "../components/shared";

const NO_HEARING_SCHEDULED_TEXT = "None scheduled";
const PROGRESSIVE_LOADING_BATCH_SIZE = 50;

const SearchBar = styled.div`
  display: flex;
  margin-bottom: ${rem(spacing.md)};
`;

type ResidentRowProps = { row: Row<ParoleResidentRow> };

function ResidentNameCell({ row }: ResidentRowProps) {
  const { isMobile } = useIsMobile(true);
  return (
    <PersonNameElement $isMobile={isMobile}>
      {row.original.individualName}
    </PersonNameElement>
  );
}

function ResidentIdCell({ row }: ResidentRowProps) {
  const { displayId, pseudonymizedId } = row.original;
  return (
    <PersonId
      personId={displayId}
      pseudoId={pseudonymizedId}
      systemType="INCARCERATION"
    >
      {formatDocId(displayId)}
    </PersonId>
  );
}

// Cells match the Workflows residents table (ClientsResidentsAllCaseloadsTable).
// The hearing date shows only its month: the resident record does not say
// whether the day is known, and some states' dates are month placeholders.
const COLUMNS: Array<ColumnDef<ParoleResidentRow>> = [
  {
    header: "Name",
    id: "individualName",
    accessorKey: "individualName",
    enableSorting: true,
    sortingFn: "text",
    cell: ResidentNameCell,
  },
  {
    header: "DOC ID",
    id: "displayId",
    accessorKey: "displayId",
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ResidentIdCell,
  },
  {
    header: "Facility",
    id: "facility",
    accessorKey: "facility",
    enableSorting: true,
    sortingFn: "text",
  },
  {
    header: "Next Hearing",
    id: "hearingDate",
    accessorKey: "hearingDate",
    enableSorting: true,
    sortingFn: "alphanumeric",
    sortUndefined: "last",
    cell: (info) => {
      const hearingDate = info.getValue<string | undefined>();
      return hearingDate
        ? formatMonth(parseIsoDate(hearingDate))
        : NO_HEARING_SCHEDULED_TEXT;
    },
  },
];

/**
 * Renders the search box and the residents table for the selected
 * facilities.
 */
export const ParoleResidentsTable = observer(function ParoleResidentsTable({
  presenter,
}: {
  presenter: ParoleResidentsPresenter;
}) {
  return (
    <>
      <SearchBar>
        <SearchInputWrapper>
          <SearchIcon />
          <SearchInput
            className="fs-exclude"
            value={presenter.searchQuery}
            onChange={(e) => presenter.setSearchQuery(e.target.value)}
            placeholder="Search by name or DOC ID"
            aria-label="Search by name or DOC ID"
          />
        </SearchInputWrapper>
      </SearchBar>

      <CaseloadTable
        data={presenter.filteredResidents}
        columns={COLUMNS}
        initialState={{ sorting: [{ id: "individualName", desc: false }] }}
        enableProgressiveLoading
        progressiveLoadingBatchSize={PROGRESSIVE_LOADING_BATCH_SIZE}
        rowLinkUrl={(resident) =>
          paroleUrl("caseProfile", {
            pseudonymizedId: resident.pseudonymizedId,
          })
        }
      />

      <Summary>
        Showing {presenter.filteredResidents.length} of{" "}
        {presenter.totalResidentsCount} residents
      </Summary>
    </>
  );
});
