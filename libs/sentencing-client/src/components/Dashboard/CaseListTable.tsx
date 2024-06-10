// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import moment from "moment";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { psiUrl } from "../../utils/routing";
import {
  CaseStatus,
  DUE_DATE_KEY,
  FULL_NAME_KEY,
  NO_CASES_MESSAGE,
} from "./constants";
import * as Styled from "./Dashboard.styles";
import { useDetectOutsideClick } from "./hooks";

export type HeaderCell = { key: string; name: string };

export type ContentCell = {
  key: string;
  caseId: string;
  value: string;
};

type ContentRow = { caseId: string; row: ContentCell[] };

type CaseListTableProps = {
  headerRow: HeaderCell[];
  rows: ContentRow[];
  staffPseudoId: string;
};

export const CaseListTable = ({
  headerRow,
  rows,
  staffPseudoId,
}: CaseListTableProps) => {
  const navigate = useNavigate();
  const dropdownRef = useDetectOutsideClick(() => setShowFilterDropdown(false));

  const [activeSortFilterKey, setActiveSortFilterKey] = useState(DUE_DATE_KEY);
  const [orderByAscending, setOrderByAscending] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [includedStatusFilter, setIncludedStatusFilter] = useState(
    Object.values(CaseStatus),
  );

  const numberOfCasesDisplay = `${rows.length} ${rows.length === 1 ? "case" : "cases"}`;

  const filterOptions = [
    { key: "Active" },
    ...Object.values(CaseStatus).map((status) => ({
      key: status,
    })),
  ];

  const filteredAndSortedRows = useMemo(
    () =>
      rows
        .filter((rowContent) => {
          const statusValue =
            rowContent.row.find((cell) => cell.key === "status")?.value ?? "";
          return includedStatusFilter.includes(statusValue);
        })
        .sort((a, b) => {
          if (activeSortFilterKey === DUE_DATE_KEY) {
            const valueA = a.row.find(
              (cell) => cell.key === DUE_DATE_KEY,
            )?.value;
            const valueB = b.row.find(
              (cell) => cell.key === DUE_DATE_KEY,
            )?.value;
            const diff = moment(valueA).diff(moment(valueB));
            return orderByAscending ? diff : diff * -1;
          }

          if (activeSortFilterKey === FULL_NAME_KEY) {
            const valueA = a.row.find(
              (cell) => cell.key === FULL_NAME_KEY,
            )?.value;
            const valueB = b.row.find(
              (cell) => cell.key === FULL_NAME_KEY,
            )?.value;
            const diff = valueA && valueB ? valueA.localeCompare(valueB) : 0;
            return orderByAscending ? diff : diff * -1;
          }

          return 0;
        }),
    [rows, includedStatusFilter, orderByAscending, activeSortFilterKey],
  );

  const handleFilterChange = (key: string) => {
    setIncludedStatusFilter((prev) => {
      if (key === "Active") {
        return prev.length > 0 ? [] : Object.values(CaseStatus);
      }
      if (prev.includes(key)) {
        return prev.filter((status) => status !== key);
      }
      return [...prev, key];
    });
  };

  return (
    <Styled.CaseListContainer>
      <Styled.Header>
        <Styled.TitleWrapper>
          <Styled.SectionTitle>My Cases</Styled.SectionTitle>
          <Styled.SectionSubtitle>
            {numberOfCasesDisplay}
          </Styled.SectionSubtitle>
        </Styled.TitleWrapper>
        <Styled.DropdownContainer ref={dropdownRef}>
          <Styled.DropdownButton
            onClick={() => setShowFilterDropdown((prev) => !prev)}
            isOpen={showFilterDropdown}
          >
            Active
          </Styled.DropdownButton>
          {showFilterDropdown && (
            <Styled.Dropdown>
              <Styled.DropdownHeader>
                <span>Status</span>
                <Styled.ClearButton onClick={() => setIncludedStatusFilter([])}>
                  Clear
                </Styled.ClearButton>
              </Styled.DropdownHeader>
              {filterOptions.map(({ key }) => (
                <Styled.DropdownOption
                  key={key}
                  isNested={key !== "Active" && key !== "Archived"}
                >
                  <input
                    id={`${key}-checkbox-status-filter-option`}
                    type="checkbox"
                    checked={
                      key === "Active"
                        ? includedStatusFilter.length > 0
                        : includedStatusFilter.includes(key)
                    }
                    onChange={() => handleFilterChange(key)}
                  />
                  <label htmlFor={`${key}-checkbox-status-filter-option`}>
                    {key}
                  </label>
                </Styled.DropdownOption>
              ))}
            </Styled.Dropdown>
          )}
        </Styled.DropdownContainer>
      </Styled.Header>

      {filteredAndSortedRows.length > 0 ? (
        <Styled.CaseOverviewWrapper isHeader>
          {headerRow.map((cell) => (
            <Styled.Cell
              key={cell.key}
              sortable={cell.key === DUE_DATE_KEY || cell.key === FULL_NAME_KEY}
              isAscending={orderByAscending}
              isActiveSort={cell.key === activeSortFilterKey}
              onClick={() => {
                if (cell.key === DUE_DATE_KEY) {
                  setActiveSortFilterKey(DUE_DATE_KEY);
                  setOrderByAscending(!orderByAscending);
                }
                if (cell.key === FULL_NAME_KEY) {
                  setActiveSortFilterKey(FULL_NAME_KEY);
                  setOrderByAscending(!orderByAscending);
                }
              }}
            >
              {cell.name}
            </Styled.Cell>
          ))}
        </Styled.CaseOverviewWrapper>
      ) : (
        NO_CASES_MESSAGE
      )}

      {filteredAndSortedRows.map((rowContent) => {
        const caseStatus = rowContent.row.find(
          (cell) => cell.key === "status",
        )?.value;
        const buttonDisplayName =
          !caseStatus || caseStatus === CaseStatus.NotYetStarted
            ? "Get Started"
            : "View Case";

        return (
          <Styled.CaseOverviewItem key={rowContent.caseId}>
            <Styled.CaseOverviewWrapper>
              {rowContent.row.map((cell) => (
                <Styled.Cell key={cell.key}>{cell.value}</Styled.Cell>
              ))}
              <Styled.Button
                onClick={() =>
                  navigate(
                    psiUrl("caseDetails", {
                      staffPseudoId,
                      caseId: rowContent.caseId,
                    }),
                  )
                }
              >
                {buttonDisplayName}
              </Styled.Button>
            </Styled.CaseOverviewWrapper>
          </Styled.CaseOverviewItem>
        );
      })}
    </Styled.CaseListContainer>
  );
};
