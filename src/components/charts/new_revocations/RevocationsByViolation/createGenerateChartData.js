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

import map from "lodash/fp/map";
import pipe from "lodash/fp/pipe";
import pick from "lodash/fp/pick";
import concat from "lodash/fp/concat";
import mergeAllWith from "lodash/fp/mergeAllWith";
import toInteger from "lodash/fp/toInteger";

import { calculateRate } from "../helpers/rate";
import { COLORS } from "../../../../assets/scripts/constants/colors";

const createGenerateChartData = (dataFilter, violationTypes) => (apiData) => {
  const violationCountKey = "violation_count";

  const allViolationTypeKeys = map("key", violationTypes);

  const violationToCount = pipe(
    dataFilter,
    map(pick(concat(allViolationTypeKeys, violationCountKey))),
    mergeAllWith((a, b) => toInteger(a) + toInteger(b))
  )(apiData);

  const totalViolationCount = toInteger(violationToCount[violationCountKey]);
  const numerators = map(
    (type) => violationToCount[type],
    allViolationTypeKeys
  );
  const denominators = map(() => totalViolationCount, allViolationTypeKeys);
  const chartDataPoints = map(
    (type) =>
      calculateRate(violationToCount[type], totalViolationCount).toFixed(2),
    allViolationTypeKeys
  );

  // This sets bar color to light-blue-500 when it's a technical violation, orange when it's law
  const colorTechnicalAndLaw = violationTypes.map((violationType) => {
    switch (violationType.type) {
      case "TECHNICAL":
        return COLORS["lantern-light-blue"];
      case "LAW":
        return COLORS["lantern-orange"];
      default:
        return COLORS["lantern-light-blue"];
    }
  });

  return {
    data: {
      labels: map("label", violationTypes),
      datasets: [
        {
          label: "Proportion of violations",
          backgroundColor: colorTechnicalAndLaw,
          hoverBackgroundColor: colorTechnicalAndLaw,
          hoverBorderColor: colorTechnicalAndLaw,
          data: chartDataPoints,
        },
      ],
    },
    numerators,
    denominators,
  };
};

export default createGenerateChartData;
