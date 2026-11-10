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

import React from "react";

import { PaginationProps } from "../../hooks/usePagination";
import ChevronLeftIcon from "../assets/chevron-left.svg?react";
import ChevronRightIcon from "../assets/chevron-right.svg?react";
import * as Styled from "../HousingApplications/ApplicationsTable/ApplicationsTable.styles";

export const Pagination: React.FC<PaginationProps> = ({
  canNextPage,
  canPreviousPage,
  onNextPage,
  onPreviousPage,
  pageIndex,
  pageSize,
  totalCount,
}) => {
  const from = totalCount === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalCount);

  return (
    <Styled.PaginationContainer>
      <Styled.PaginationButton
        disabled={!canPreviousPage}
        onClick={onPreviousPage}
      >
        <ChevronLeftIcon style={{ opacity: canPreviousPage ? 1 : 0.4 }} />
      </Styled.PaginationButton>

      <div>
        <Styled.PaginationText>
          Showing {from}-{to} of {totalCount}
        </Styled.PaginationText>
      </div>

      <Styled.PaginationButton disabled={!canNextPage} onClick={onNextPage}>
        <ChevronRightIcon style={{ opacity: canNextPage ? 1 : 0.4 }} />
      </Styled.PaginationButton>
    </Styled.PaginationContainer>
  );
};
