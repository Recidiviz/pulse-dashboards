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

import groupBy from "lodash/fp/groupBy";
import map from "lodash/fp/map";
import pipe from "lodash/fp/pipe";
import reduce from "lodash/fp/reduce";
import sumBy from "lodash/fp/sumBy";
import toInteger from "lodash/fp/toInteger";
import values from "lodash/fp/values";

/**
 * Groups dataset by month/year and sum all bar counters.
 */
export const groupByMonth = (barKeys) => (dataset) =>
  pipe(
    groupBy((item) => `${item.year}-${item.month}`),
    values,
    map((data) => ({
      year: data[0].year,
      month: data[0].month,
      ...reduce(
        (acc, barKey) => ({
          ...acc,
          [barKey]: sumBy((o) => toInteger(o[barKey]), data),
        }),
        {},
        barKeys,
      ),
    })),
  )(dataset);
