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

import { useCallback, useState } from "react";

export interface PaginationProps {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  canNextPage: boolean;
  canPreviousPage: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
}

export function usePagination() {
  const [cursorState, setCursorState] = useState({
    stack: [undefined] as (string | undefined)[],
    pageIndex: 0,
  });

  const cursor = cursorState.stack[cursorState.pageIndex];

  const goNext = (nextCursor: string | null) => {
    if (!nextCursor) return;
    setCursorState((prev) => {
      const updated = [...prev.stack];
      updated[prev.pageIndex + 1] = nextCursor;
      return { stack: updated, pageIndex: prev.pageIndex + 1 };
    });
  };

  const goPrevious = () => {
    setCursorState((prev) => {
      return { stack: prev.stack, pageIndex: prev.pageIndex - 1 };
    });
  };

  const reset = useCallback(() => {
    setCursorState({ stack: [undefined], pageIndex: 0 });
  }, []);

  const canGoPrevious = cursorState.pageIndex > 0;

  const getProps = ({
    data,
    pageSize,
    isNavigating = false,
  }: {
    data: { nextCursor?: string | null; total: number } | undefined;
    pageSize: number;
    isNavigating?: boolean;
  }): PaginationProps => ({
    pageIndex: cursorState.pageIndex,
    pageSize,
    totalCount: data?.total ?? 0,
    canNextPage: !!data?.nextCursor && !isNavigating,
    canPreviousPage: canGoPrevious && !isNavigating,
    onNextPage: () => {
      if (isNavigating) return;
      goNext(data?.nextCursor ?? null);
    },
    onPreviousPage: () => {
      if (isNavigating) return;
      goPrevious();
    },
  });

  return {
    cursor,
    pageIndex: cursorState.pageIndex,
    goNext,
    goPrevious,
    reset,
    canGoPrevious,
    getProps,
  };
}
