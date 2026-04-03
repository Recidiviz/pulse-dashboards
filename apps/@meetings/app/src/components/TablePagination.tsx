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

import { TouchableOpacity, View } from "react-native";
import ChevronLeftIcon from "react-native-heroicons/outline/ChevronLeftIcon";
import ChevronRightIcon from "react-native-heroicons/outline/ChevronRightIcon";

import { Typography } from "../shared/ui/Typography";

const PAGE_SIZE = 7;

type Props = {
  page: number;
  setPrevPage: () => void;
  setNextPage: () => void;
  tableItemsLength: number;
  pageSize?: number;
};

/**
 * Pagination for table
 * @param page Current page number
 * @param setPage Function to set the current page number
 * @param tableItemsLength Total number of items in the table
 * @param pageSize Number of items per page, default is 7
 * @returns Pagination component
 */
export const TablePagination = ({
  page,
  setPrevPage,
  setNextPage,
  tableItemsLength,
  pageSize = PAGE_SIZE,
}: Props) => {
  return (
    <View className="flex w-full flex-row items-center justify-center gap-2 bg-primary py-2">
      <TouchableOpacity onPress={setPrevPage} disabled={page === 1}>
        <ChevronLeftIcon
          className={`size-3.5 stroke-[4px] ${page === 1 ? "stroke-disabled" : "stroke-brand"}`}
        />
      </TouchableOpacity>
      <Typography className="text-sm font-medium text-brand">
        Showing {(page - 1) * pageSize + 1}-
        {Math.min(page * pageSize, tableItemsLength)} of {tableItemsLength}
      </Typography>
      <TouchableOpacity
        onPress={setNextPage}
        disabled={page * pageSize >= tableItemsLength}
      >
        <ChevronRightIcon
          className={`size-3.5 stroke-[4px] ${page * PAGE_SIZE >= tableItemsLength ? "stroke-disabled" : "stroke-brand"}`}
        />
      </TouchableOpacity>
    </View>
  );
};
