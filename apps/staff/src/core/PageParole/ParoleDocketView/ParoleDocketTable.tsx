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
import { useMemo } from "react";
import styled from "styled-components";

import { ParoleHearing } from "~datatypes";
import { palette } from "~design-system";

import SearchIconComponent from "../../../assets/static/images/search.svg?react";
import { ParoleDocketPresenter } from "../../../ParoleStore/presenters/ParoleDocketPresenter";
import { formatDocId } from "../../../ParoleStore/utils";
import { CaseloadTable } from "../../CaseloadTable";
import { ParoleDocketColumn } from "../../models/types";
import { SectionCard } from "../../SectionCard";
import { paroleUrl } from "../../views";
import { WorkflowsFilterDropdown } from "../../WorkflowsFilters/WorkflowsFilterDropdown";
import { parseIsoDate } from "../components/shared";

type HearingDatePrecision = "month" | "date";

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

const formatHearingDate = (
  dateString: string,
  precision: HearingDatePrecision,
) =>
  parseIsoDate(dateString).toLocaleDateString(
    "en-US",
    precision === "month"
      ? { month: "long" }
      : { month: "long", day: "numeric", year: "numeric" },
  );

const HeaderLabel = styled.span`
  padding-left: ${rem(spacing.md)};
`;

/** Header for the first column, which carries the row's leading inset. */
function renderLeadingHeader(header: string) {
  return function LeadingHeader(): JSX.Element {
    return <HeaderLabel>{header}</HeaderLabel>;
  };
}

/**
 * Draws one cell's value according to its column's format.
 *
 * @param value - The raw hearing field.
 * @param column - The column being drawn.
 * @param isLeading - Whether this is the first column, which is inset.
 */
function renderCell(
  value: unknown,
  column: ParoleDocketColumn,
  isLeading: boolean,
): JSX.Element {
  if (column.format === "docId") {
    return renderCellText(formatDocId(value as string), isLeading);
  }
  if (column.format === "month" || column.format === "date") {
    return renderCellText(
      formatHearingDate(value as string, column.format),
      isLeading,
    );
  }
  return renderCellText(value, isLeading);
}

/**
 * Turns a tenant's column list into the table's own column definitions.
 * Callers must memoize on that list: a fresh array identity each render would
 * defeat CaseloadTable's (@tanstack/react-table) memoization of column/sort
 * state.
 *
 * @param columns - The tenant's columns, in display order.
 */
function buildColumns(
  columns: ReadonlyArray<ParoleDocketColumn>,
): Array<ColumnDef<ParoleHearing>> {
  return columns.map((column, index) => {
    const isLeading = index === 0;
    return {
      header: isLeading ? renderLeadingHeader(column.header) : column.header,
      id: column.field,
      accessorKey: column.field,
      enableSorting: Boolean(column.sortable),
      sortingFn: "alphanumeric",
      cell: (info) => renderCell(info.getValue(), column, isLeading),
    };
  });
}

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
  const columns = useMemo(
    () => buildColumns(presenter.docketColumns),
    [presenter.docketColumns],
  );

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
          columns={columns}
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
