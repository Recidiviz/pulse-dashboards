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

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { psiUrl } from "../../utils/routing";
import {
  CLIENT_FULL_NAME_KEY,
  DUE_DATE_KEY,
  NO_CASES_MESSAGE,
} from "./constants";
import * as Styled from "./Dashboard.styles";
import { useDetectOutsideClick } from "./hooks";
import { CaseStatus, ContentRow, HeaderCell } from "./types";
import { DIFF_FUNCTIONS } from "./utils";

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

  const [activeSortKey, setActiveSortKey] = useState(DUE_DATE_KEY);
  const [orderByAscending, setOrderByAscending] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [includedStatusFilter, setIncludedStatusFilter] = useState<
    CaseStatus[]
  >(Object.values(CaseStatus));

  const numberOfCasesDisplay = `${rows.length} ${rows.length === 1 ? "case" : "cases"}`;

  const filterOptions: { key: CaseStatus | "Active" }[] = [
    { key: "Active" },
    ...Object.values(CaseStatus).map((status) => ({
      key: status,
    })),
  ];

  const filteredAndSortedRows = useMemo(
    () =>
      rows
        .filter((rowContent) => {
          const statusValue = rowContent.row.find(
            (cell) => cell.key === "status",
          )?.value as CaseStatus;
          return includedStatusFilter.includes(statusValue);
        })
        .sort((a, b) => {
          const diffFunction = DIFF_FUNCTIONS[activeSortKey];
          const diff = diffFunction(a, b);
          return diff * (orderByAscending ? 1 : -1);
        }),
    [rows, includedStatusFilter, orderByAscending, activeSortKey],
  );

  const handleFilterChange = (key: CaseStatus | "Active") => {
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
                <Styled.DropdownOption key={key} isNested={key !== "Active"}>
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
              sortable={
                cell.key === DUE_DATE_KEY || cell.key === CLIENT_FULL_NAME_KEY
              }
              isAscending={orderByAscending}
              isActiveSort={cell.key === activeSortKey}
              onClick={() => {
                if ([DUE_DATE_KEY, CLIENT_FULL_NAME_KEY].includes(cell.key)) {
                  setActiveSortKey(cell.key);
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
