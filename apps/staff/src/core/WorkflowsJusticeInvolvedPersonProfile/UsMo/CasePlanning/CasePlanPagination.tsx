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
import styled from "styled-components";

import { palette, typography } from "~design-system";

type CasePlanPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const PaginationRow = styled.div`
  align-items: flex-end;
  display: flex;
  gap: 15px;
  justify-content: right;
  padding-top: 5px;
  padding-right: 5px;
`;

const PaginationText = styled.div`
  color: ${palette.pine1};
  ${typography.Sans12}
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const PaginationButton = styled.button`
  background: none;
  border: none;
  color: ${palette.slate60};
  cursor: pointer;
  padding: 0;

  &:hover:not(:disabled) {
    color: ${palette.pine1};
  }

  &:disabled {
    cursor: default;
  }

  // Matches the "back" chevron weight used elsewhere in Workflows
  // (backLinkStyles in NavigationBackButton.tsx) rather than a hand-drawn
  // SVG stroke, and inherits color (incl. hover/disabled) for free.
  & i {
    font-size: 1rem;
  }
`;

export const CasePlanPagination: React.FC<CasePlanPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;

  return (
    <PaginationRow>
      <PaginationText>
        {currentPage + 1} of {totalPages}
      </PaginationText>
      <PaginationButtons>
        <PaginationButton
          aria-label="First page"
          disabled={isFirstPage}
          onClick={() => onPageChange(0)}
        >
          <i className="fa fa-angle-double-left" />
        </PaginationButton>
        <PaginationButton
          aria-label="Previous page"
          disabled={isFirstPage}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <i className="fa fa-angle-left" />
        </PaginationButton>
        <PaginationButton
          aria-label="Next page"
          disabled={isLastPage}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <i className="fa fa-angle-right" />
        </PaginationButton>
        <PaginationButton
          aria-label="Last page"
          disabled={isLastPage}
          onClick={() => onPageChange(totalPages - 1)}
        >
          <i className="fa fa-angle-double-right" />
        </PaginationButton>
      </PaginationButtons>
    </PaginationRow>
  );
};
