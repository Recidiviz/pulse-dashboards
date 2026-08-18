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
import { ColumnDef } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { ParoleHearing } from "~datatypes";
import { palette } from "~design-system";

import SearchIconComponent from "../../../assets/static/images/search.svg?react";
import { ParoleDocketPresenter } from "../../../ParoleStore/presenters/ParoleDocketPresenter";
import { formatDocId } from "../../../ParoleStore/utils";
import { CaseloadTable } from "../../CaseloadTable";
import { SectionCard } from "../../SectionCard";
import { paroleUrl } from "../../views";
import { WorkflowsFilterDropdown } from "../../WorkflowsFilters/WorkflowsFilterDropdown";
import { parseIsoDate } from "../components/shared";

const FilterBar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: ${rem(spacing.md)};
`;

const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: ${rem(280)};
  margin-right: auto;
  border: 1px solid ${palette.slate10};
  border-radius: ${rem(spacing.sm)};
  padding: 0 ${rem(spacing.md)};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${rem(spacing.sm)};
  border-radius: ${rem(spacing.sm)};
  border: 0;
  outline: 0;

  &::placeholder {
    color: ${palette.slate60};
  }
`;

const SearchIcon = styled(SearchIconComponent)`
  width: ${rem(18)};
  height: ${rem(18)};
  flex-shrink: 0;
`;

const Summary = styled.div`
  margin-top: ${rem(spacing.md)};
  color: ${palette.slate70};
`;

// CaseloadTable's cells default to the browser's baseline vertical-align
// (rather than middle), so plain text sits at the top of the fixed-height
// row instead of centered.
const CellContent = styled.div<{ $leadingInset?: boolean }>`
  display: flex;
  align-items: center;
  height: 100%;
  ${({ $leadingInset }) => $leadingInset && `padding-left: ${rem(spacing.md)};`}
`;

// Long values (e.g. facility names) truncate with an ellipsis instead of
// wrapping -- wrapped text would grow the row past CaseloadTable's fixed
// row height and lose its vertical padding.
const CellText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

function renderCellText(value: unknown, leadingInset = false): JSX.Element {
  const text = typeof value === "string" ? value : String(value ?? "");
  return (
    <CellContent $leadingInset={leadingInset}>
      <CellText title={text}>{text}</CellText>
    </CellContent>
  );
}

const formatHearingDate = (dateString: string) =>
  parseIsoDate(dateString).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    day: "numeric",
  });

function renderHearingDateCell(dateString: unknown): JSX.Element {
  return renderCellText(formatHearingDate(dateString as string));
}

function renderDocIdCell(docId: unknown): JSX.Element {
  return renderCellText(formatDocId(docId as string));
}

const HeaderLabel = styled.span`
  padding-left: ${rem(spacing.md)};
`;

function renderNameHeader(): JSX.Element {
  return <HeaderLabel>Name</HeaderLabel>;
}

// None of these entries depend on props/state, so this is built once at
// module load instead of on every render -- a fresh array identity each
// render would defeat CaseloadTable's (@tanstack/react-table) memoization of
// column/sort state.
const COLUMNS: Array<ColumnDef<ParoleHearing>> = [
  {
    header: renderNameHeader,
    id: "individualName",
    accessorKey: "individualName",
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: (info) => renderCellText(info.getValue(), true),
  },
  {
    header: "DOC ID",
    id: "docId",
    accessorKey: "docId",
    enableSorting: false,
    cell: (info) => renderDocIdCell(info.getValue()),
  },
  {
    header: "Hearing Date",
    id: "hearingDate",
    // hearingDate is a "yyyy-MM-dd" ISO string, so lexicographic (alphanumeric)
    // sorting is equivalent to chronological sorting.
    accessorKey: "hearingDate",
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: (info) => renderHearingDateCell(info.getValue()),
  },
  {
    header: "Hearing Type",
    id: "hearingType",
    accessorKey: "hearingType",
    enableSorting: false,
    cell: (info) => renderCellText(info.getValue()),
  },
  {
    header: "Facility",
    id: "facility",
    accessorKey: "facility",
    enableSorting: false,
    cell: (info) => renderCellText(info.getValue()),
  },
];

/**
 * Renders the docket's filter bar (search + facility/hearing-type dropdown)
 * and the hearings table beneath it. Grouped together because the filter bar
 * only exists to narrow what the table displays.
 */
export const ParoleDocketTable = observer(function ParoleDocketTable({
  presenter,
}: {
  presenter: ParoleDocketPresenter;
}) {
  return (
    <>
      <FilterBar>
        {presenter.docketSearchEnabled && (
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
        )}
        <WorkflowsFilterDropdown presenter={presenter} />
      </FilterBar>

      <SectionCard>
        <CaseloadTable
          data={presenter.filteredHearings}
          columns={COLUMNS}
          initialState={{ sorting: [{ id: "hearingDate", desc: false }] }}
          rowLinkUrl={(hearing) =>
            paroleUrl("caseProfile", { docId: hearing.docId })
          }
        />
      </SectionCard>

      <Summary>
        Showing {presenter.filteredHearings.length} of{" "}
        {presenter.totalHearingsCount} upcoming hearings
      </Summary>
    </>
  );
});
