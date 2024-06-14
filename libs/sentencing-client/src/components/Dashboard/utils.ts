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

import { Case } from "../../api";
import { CLIENT_FULL_NAME_KEY, DUE_DATE_KEY, SortKeys } from "./constants";
import { ContentRow } from "./types";

const sortDiffByKey =
  (key: string | keyof Case) => (a: ContentRow, b: ContentRow) => {
    const valueA = a.row.find((cell) => cell.key === key)?.value;
    const valueB = b.row.find((cell) => cell.key === key)?.value;

    if (key === DUE_DATE_KEY) {
      return moment(valueA).diff(moment(valueB));
    }
    return valueA && valueB ? valueA.localeCompare(valueB) : 0;
  };

export const DIFF_FUNCTIONS = {
  [SortKeys.ClientFullName]: sortDiffByKey(CLIENT_FULL_NAME_KEY),
  [SortKeys.DueDate]: sortDiffByKey(DUE_DATE_KEY),
};
