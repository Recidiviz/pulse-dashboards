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

import React, { useId } from "react";
import styled from "styled-components";

import {
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
  palette,
  typography,
} from "~design-system";

const SIZE_STYLES = {
  small: { text: typography.Sans12, iconSize: "1rem", gap: "15px" },
  large: { text: typography.Sans14, iconSize: "1.25rem", gap: "20px" },
} as const;

type PaginationSize = keyof typeof SIZE_STYLES;

type PaginationProps = {
  /** Zero-indexed. */
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /**
   * Replaces the default "<page> of <total pages>" counter. Pass it where the
   * page number is not what the reader counts
   *
   * Example: The US_ID parole board counts notes, and shows "1-10 of 32".
   */
  summary?: string;
  /** Adds a "Rows per page" menu. Omit for a fixed page size. */
  pageSize?: {
    value: number;
    options: ReadonlyArray<number>;
    onChange: (pageSize: number) => void;
  };
  /** Text and arrow size. Defaults to "small". */
  size?: PaginationSize;
};

const PaginationRow = styled.div<{
  $size: PaginationSize;
  $hasPageSizeMenu: boolean;
}>`
  ${({ $size }) => SIZE_STYLES[$size].text}
  color: ${palette.pine1};
  align-items: ${({ $hasPageSizeMenu }) =>
    $hasPageSizeMenu ? "center" : "flex-end"};
  display: flex;
  gap: ${({ $size }) => SIZE_STYLES[$size].gap};
  justify-content: right;
  padding-top: 5px;
  padding-right: 5px;

  & i {
    font-size: ${({ $size }) => SIZE_STYLES[$size].iconSize};
  }
`;

const PageSizeControl = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PageSizeToggle = styled(DropdownToggle)`
  font: inherit;
  color: ${palette.pine1};
  min-height: 0;
  min-width: 0;
  padding: 4px 8px;

  &:hover {
    background-color: ${palette.slate10};
    color: ${palette.pine4};
  }
  &:focus {
    background-color: unset;
  }
`;

const PageSizeMenu = styled(DropdownMenu)`
  min-width: 0;
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
`;

/**
 * First/previous/next/last controls with a counter, and an optional page-size
 * menu. Without the menu, it renders only when there is more than one page.
 * With it, it always renders, so a reader who picks a large page size can
 * pick a smaller one again. The caller owns the paging state and slices its
 * own data; this renders the controls alone.
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  summary,
  pageSize,
  size = "small",
}) => {
  const pageSizeId = useId();
  const pageSizeLabelId = `${pageSizeId}-label`;
  const pageSizeToggleId = `${pageSizeId}-toggle`;

  if (totalPages <= 1 && !pageSize) {
    return null;
  }

  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;

  return (
    <PaginationRow $size={size} $hasPageSizeMenu={Boolean(pageSize)}>
      {pageSize && (
        <PageSizeControl>
          <span id={pageSizeLabelId}>Rows per page</span>
          <Dropdown>
            <PageSizeToggle
              id={pageSizeToggleId}
              aria-labelledby={`${pageSizeLabelId} ${pageSizeToggleId}`}
              showCaret
            >
              {pageSize.value}
            </PageSizeToggle>
            <PageSizeMenu ariaLabel="Rows per page">
              {pageSize.options.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => pageSize.onChange(option)}
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </PageSizeMenu>
          </Dropdown>
        </PageSizeControl>
      )}
      <div>{summary ?? `${currentPage + 1} of ${totalPages}`}</div>
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
