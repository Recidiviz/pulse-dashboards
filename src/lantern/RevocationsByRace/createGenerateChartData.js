// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import pipe from "lodash/fp/pipe";
import reduce from "lodash/fp/reduce";
import sumBy from "lodash/fp/sumBy";
import toInteger from "lodash/fp/toInteger";
import map from "lodash/fp/map";
import groupBy from "lodash/fp/groupBy";

import {
  getStatePopulations,
  getStatePopulationsLabels,
} from "../../utils/formatStrings";
import getCounts from "../utils/getCounts";
import createPopulationMap from "../utils/createPopulationMap";
import { translate } from "../../utils/i18nSettings";
import { applyStatisticallySignificantShadingToDataset } from "../utils/significantStatistics";
import { COLORS } from "../../assets/scripts/constants/colors";

export const CHART_COLORS = [
  COLORS["lantern-bright-orange"],
  COLORS["lantern-yellow"],
  COLORS["lantern-ocean-blue"],
  COLORS["lantern-sky-blue"],
  COLORS["lantern-green"],
];

export const generateDatasets = (dataPoints, denominators) => {
  const raceLabelMap = translate("raceLabelMap");
  const raceLabels = Object.values(raceLabelMap);
  return raceLabels.map((raceLabel, index) => ({
    label: raceLabel,
    backgroundColor: applyStatisticallySignificantShadingToDataset(
      CHART_COLORS[index],
      denominators
    ),
    data: dataPoints[index],
  }));
};

const createGenerateStackedChartData = ({
  filteredData,
  statePopulationData,
}) => {
  const raceLabelMap = translate("raceLabelMap");
  const races = Object.keys(raceLabelMap);
  const { dataPoints, numerators, denominators } = pipe(
    reduce(createPopulationMap("race"), {}),
    (data) =>
      getCounts(
        data,
        getStatePopulations(),
        races,
        statePopulationData,
        "race_or_ethnicity"
      )
  )(filteredData);

  const datasets = generateDatasets(dataPoints, denominators);

  const data = {
    labels: getStatePopulationsLabels(),
    datasets,
  };

  return {
    data,
    numerators,
    denominators,
  };
};

const createGenerateChartDataByMode = (
  { filteredData, statePopulationData },
  mode
) => {
  const raceLabelMap = translate("raceLabelMap");
  const races = Object.keys(raceLabelMap);
  const { dataPoints, numerators, denominators } = pipe(
    groupBy((d) => [d.race, d.admission_type]),
    map((dataset) => ({
      race: dataset[0].race,
      revocation_count: sumBy(
        (item) => toInteger(item.revocation_count),
        dataset
      ),
      revocation_count_all: sumBy(
        (item) => toInteger(item.revocation_count_all),
        dataset
      ),
      supervision_population_count: sumBy(
        (item) => toInteger(item.supervision_population_count),
        dataset
      ),
      supervision_count_all: sumBy(
        (item) => toInteger(item.supervision_count_all),
        dataset
      ),
      recommended_for_revocation_count: sumBy(
        (item) => toInteger(item.recommended_for_revocation_count),
        dataset
      ),
      recommended_for_revocation_count_all: sumBy(
        (item) => toInteger(item.recommended_for_revocation_count_all),
        dataset
      ),
    })),
    groupBy("race"),
    map((dataset) => ({
      race: dataset[0].race,
      revocation_count: sumBy(
        (item) => toInteger(item.revocation_count),
        dataset
      ),
      revocation_count_all: sumBy(
        (item) => toInteger(item.revocation_count_all),
        dataset
      ),
      supervision_population_count: dataset[0].supervision_population_count,
      supervision_count_all: dataset[0].supervision_count_all,
      recommended_for_revocation_count:
        dataset[0].recommended_for_revocation_count,
      recommended_for_revocation_count_all:
        dataset[0].recommended_for_revocation_count_all,
    })),
    reduce(createPopulationMap("race"), {}),
    (data) =>
      getCounts(
        data,
        getStatePopulations(),
        races,
        statePopulationData,
        "race_or_ethnicity"
      )
  )(filteredData);

  const datasets = generateDatasets(dataPoints, denominators);
  const datasetIndex = datasets.findIndex(
    (d) => d.label === translate("raceLabelMap")[mode]
  );
  const data = {
    labels: getStatePopulationsLabels(),
    datasets: [datasets[datasetIndex]],
  };

  return {
    data,
    numerators: numerators[datasetIndex],
    denominators: denominators[datasetIndex],
  };
};

const createGenerateChartData = (chartData, stacked) => (mode) => {
  return stacked
    ? createGenerateStackedChartData(chartData)
    : createGenerateChartDataByMode(chartData, mode);
};

export default createGenerateChartData;
