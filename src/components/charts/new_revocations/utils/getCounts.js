// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2020 Recidiviz, Inc.
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

import getOr from "lodash/fp/getOr";
import { calculateRate } from "../helpers/rate";

const getCounts = (transformedData, riskLevels, dimensions) => {
  const dataPoints = [];
  const numerators = [];
  const denominators = [];

  dimensions.forEach((dimension, i) => {
    dataPoints.push([]);
    numerators.push([]);
    denominators.push([]);

    riskLevels.forEach((riskLevel) => {
      const numerator = getOr(0, [dimension, riskLevel, 0], transformedData);
      const denominator = getOr(0, [dimension, riskLevel, 1], transformedData);
      const rate = calculateRate(numerator, denominator).toFixed(2);

      numerators[i].push(numerator);
      denominators[i].push(denominator);
      dataPoints[i].push(rate);
    });
  });

  return { dataPoints, numerators, denominators };
};

export default getCounts;
