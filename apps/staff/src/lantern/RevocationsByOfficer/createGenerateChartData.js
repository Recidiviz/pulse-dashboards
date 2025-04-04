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

import filter from "lodash/fp/filter";
import groupBy from "lodash/fp/groupBy";
import map from "lodash/fp/map";
import orderBy from "lodash/fp/orderBy";
import pipe from "lodash/fp/pipe";
import sumBy from "lodash/fp/sumBy";
import toInteger from "lodash/fp/toInteger";
import values from "lodash/fp/values";

import { COLORS } from "../../assets/scripts/constants/colors";
import { formatOfficerLabel } from "../../utils/formatStrings";
import { translate } from "../../utils/i18nSettings";
import { calculateRate } from "../utils/rate";
import { sumCounts } from "../utils/sumCounts";

const generatePercentChartData = (filteredData, mode) => {
  const fieldName =
    mode === "exits" ? "exit_count" : "supervision_population_count";

  const transformedData = pipe(
    groupBy((d) => [d.officer_label, d.admission_type]),
    map((dataset) => ({
      officer: formatOfficerLabel(dataset[0].officer_label),
      count: sumBy((item) => toInteger(item.revocation_count), dataset),
      [fieldName]: sumBy((item) => toInteger(item[fieldName]), dataset),
    })),
    groupBy("officer"),
    map((dataset) => ({
      officer: dataset[0].officer,
      count: sumBy((item) => toInteger(item.count), dataset),
      [fieldName]: dataset[0][fieldName],
    })),
    filter((item) => item[fieldName] >= 10),
    map((dataPoint) => ({
      officer: dataPoint.officer,
      count: dataPoint.count,
      [fieldName]: dataPoint[fieldName],
      rate: calculateRate(dataPoint.count, dataPoint[fieldName]),
    })),
    orderBy(["rate", "count"], ["desc", "desc"]),
  )(filteredData);

  const dataPoints = map((item) => item.rate.toFixed(2), transformedData);

  const labels = map("officer", transformedData);
  const denominators = map("supervision_population_count", transformedData);
  const numerators = map("count", transformedData);

  const datasets = [
    {
      label: translate("percentOfPopulationRevoked"),
      backgroundColor: () => COLORS["lantern-orange"],
      data: dataPoints,
    },
  ];

  const data = {
    labels,
    datasets,
  };

  const averageRate = calculateRate(
    sumCounts("revocation_count", filteredData),
    sumCounts("supervision_population_count", filteredData),
  );

  return { data, numerators, denominators, averageRate };
};

const generateCountChartData = (filteredData) => {
  const transformedData = pipe(
    groupBy("officer_label"),
    values,
    map((dataset) => ({
      officer: formatOfficerLabel(dataset[0].officer_label),
      count: sumBy((item) => toInteger(item.revocation_count), dataset),
    })),
    orderBy(["count"], ["desc"]),
  )(filteredData);

  const labels = map("officer", transformedData);
  const dataPoints = transformedData.map((item) => item.count);

  const datasets = [
    {
      label: translate("Revocations"),
      backgroundColor: COLORS["lantern-orange"],
      data: dataPoints,
    },
  ];

  return { data: { datasets, labels }, denominators: [] };
};

const createGenerateChartData = (filteredData) => (mode) => {
  switch (mode) {
    case "counts":
      return generateCountChartData(filteredData);
    case "exits":
    case "rates":
    default:
      return generatePercentChartData(filteredData, mode);
  }
};

export default createGenerateChartData;
