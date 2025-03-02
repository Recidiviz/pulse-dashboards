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
import { formatDistrictLabel } from "../../utils/formatStrings";
import { translate } from "../../utils/i18nSettings";
import { calculateRate } from "../utils/rate";
import { applyStatisticallySignificantShading } from "../utils/significantStatistics";
import { sumCounts } from "../utils/sumCounts";

const generatePercentChartData = (
  districtChartData,
  currentDistricts,
  mode,
) => {
  const fieldName =
    mode === "exits" ? "exit_count" : "supervision_population_count";
  const transformedData = pipe(
    filter((item) => item.district !== "ALL"),
    groupBy((d) => [d.district, d.admission_type]),
    map((dataset) => ({
      district: formatDistrictLabel(dataset[0].district),
      count: sumBy((item) => toInteger(item.revocation_count), dataset),
      [fieldName]: sumBy((item) => toInteger(item[fieldName]), dataset),
    })),
    groupBy("district"),
    map((dataset) => ({
      district: dataset[0].district,
      count: sumBy((item) => toInteger(item.count), dataset),
      [fieldName]: dataset[0][fieldName],
    })),
    map((dataPoint) => ({
      district: dataPoint.district,
      count: dataPoint.count,
      [fieldName]: dataPoint[fieldName],
      rate: calculateRate(dataPoint.count, dataPoint[fieldName]),
    })),
    orderBy(["rate"], ["desc"]),
  )(districtChartData);
  const dataPoints = map((item) => item.rate.toFixed(2), transformedData);

  const labels = map("district", transformedData);
  const denominators = map("supervision_population_count", transformedData);
  const numerators = map("count", transformedData);

  const getBarBackgroundColor = ({ dataIndex }) => {
    const color =
      currentDistricts &&
      labels[dataIndex] &&
      currentDistricts.find(
        (currentDistrict) =>
          currentDistrict &&
          currentDistrict.toLowerCase() === labels[dataIndex].toLowerCase(),
      )
        ? COLORS["lantern-light-blue"]
        : COLORS["lantern-orange"];
    return applyStatisticallySignificantShading(color, denominators[dataIndex]);
  };

  const datasets = [
    {
      label: translate("percentOfPopulationRevoked"),
      backgroundColor: getBarBackgroundColor,
      data: dataPoints,
    },
  ];

  const data = {
    labels,
    datasets,
  };

  const averageRate = calculateRate(
    sumCounts("revocation_count", districtChartData),
    sumCounts("supervision_population_count", districtChartData),
  );

  return { data, numerators, denominators, averageRate };
};

const generateCountChartData = (districtChartData, currentDistricts) => {
  const transformedData = pipe(
    filter((item) => item.district !== "ALL"),
    groupBy("district"),
    values,
    map((dataset) => ({
      district: formatDistrictLabel(dataset[0].district),
      count: sumBy((item) => toInteger(item.revocation_count), dataset),
    })),
    orderBy(["count"], ["desc"]),
  )(districtChartData);

  const labels = map("district", transformedData);
  const dataPoints = transformedData.map((item) => item.count);
  const getBarBackgroundColor = ({ dataIndex }) =>
    currentDistricts &&
    labels[dataIndex] &&
    currentDistricts.find(
      (currentDistrict) =>
        currentDistrict &&
        currentDistrict.toLowerCase() === labels[dataIndex].toLowerCase(),
    )
      ? COLORS["lantern-light-blue"]
      : COLORS["lantern-orange"];

  const datasets = [
    {
      label: translate("Revocations"),
      backgroundColor: getBarBackgroundColor,
      data: dataPoints,
    },
  ];
  return { data: { datasets, labels }, denominators: [] };
};

const createGenerateChartData =
  (districtChartData, currentDistricts) => (mode) => {
    switch (mode) {
      case "counts":
        return generateCountChartData(districtChartData, currentDistricts);
      case "exits":
      case "rates":
      default:
        return generatePercentChartData(
          districtChartData,
          currentDistricts,
          mode,
        );
    }
  };

export default createGenerateChartData;
