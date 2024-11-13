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

import toInteger from "lodash/toInteger";

import {
  getDimensionKey,
  getDimensionValue,
  getValueKey,
  validateMetadata,
} from "./optimizedFormatHelpers";

export function filterOptimizedDataFormat(
  unflattenedMatrix,
  metadata,
  filterFn,
  skipFilterFn = () => false,
) {
  if (!Array.isArray(unflattenedMatrix[0])) {
    throw new Error(
      `Invalid data type supplied to filterOptimizedDataFormat, expected 2D array of values.`,
    );
  }

  validateMetadata(metadata);

  const totalDataPoints = toInteger(metadata.total_data_points);
  const dimensions = metadata.dimension_manifest;
  const valueKeys = metadata.value_keys;
  const filteredDataPoints = [];

  let i = 0;
  for (i = 0; i < totalDataPoints; i += 1) {
    const dataPoint = {};
    let matchesFilter = true;

    let j = 0;
    for (j = 0; j < dimensions.length; j += 1) {
      const dimensionValueIndex = unflattenedMatrix[j][i];

      const dimensionKey = getDimensionKey(dimensions, j);
      const dimensionValue = getDimensionValue(
        dimensions,
        j,
        dimensionValueIndex,
      );

      if (skipFilterFn(dimensionKey)) {
        // If we do not want to apply the filter fn for this specific dimensionKey, do not filter anything here.
        // This is the case on the server-side when we may have filters defined for dimensions
        // that are not in the subset manifest.
        matchesFilter = true;
      } else {
        matchesFilter = filterFn(
          { [dimensionKey]: dimensionValue.toLowerCase() },
          dimensionKey,
        );
      }

      if (!matchesFilter) {
        break;
      }

      dataPoint[dimensionKey] = dimensionValue;
    }

    if (!matchesFilter) {
      /* eslint-disable-next-line no-continue */
      continue;
    }

    for (
      j = dimensions.length;
      j < dimensions.length + valueKeys.length;
      j += 1
    ) {
      const valueValue = unflattenedMatrix[j][i];
      const valueKey = getValueKey(valueKeys, j - dimensions.length);
      dataPoint[valueKey] = valueValue;
    }

    filteredDataPoints.push(dataPoint);
  }

  return filteredDataPoints;
}
