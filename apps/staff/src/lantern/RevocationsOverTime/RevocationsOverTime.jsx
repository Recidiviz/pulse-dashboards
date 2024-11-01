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

import map from "lodash/fp/map";
import pipe from "lodash/fp/pipe";
import { get } from "mobx";
import { observer } from "mobx-react-lite";
import PropTypes from "prop-types";
import React from "react";
import { Bar, Line } from "react-chartjs-2";

import { COLORS } from "../../assets/scripts/constants/colors";
import ErrorMessage from "../../components/ErrorMessage";
import { groupByMonth } from "../../core/bars/utils";
import { toNumber } from "../../utils";
import {
  centerSingleMonthDatasetIfNecessary,
  sortFilterAndSupplementMostRecentMonths,
} from "../../utils/datasets";
import { translate } from "../../utils/i18nSettings";
import { generateTrendlineDataset } from "../../utils/trendline";
import { useContainerHeight } from "../hooks/useContainerHeight";
import { useLanternStore } from "../LanternStoreProvider";
import LoadingChart from "../LoadingChart";
import RevocationsByDimensionComponent from "../RevocationsByDimension/RevocationsByDimensionComponent";
import { METRIC_PERIOD_MONTHS } from "../utils/constants";
import {
  currentMonthBox,
  monthNamesAllWithYearsFromNumbers,
} from "../utils/currentSpan";

function RevocationsOverTime({ timeDescription }) {
  const { filters, dataStore } = useLanternStore();
  const store = dataStore.revocationsOverTimeStore;
  const CHART_TITLE = translate("revocationsOverTimeChartTitle");
  const CHART_ID = translate("revocationsOverTimeChartId");
  const { containerHeight, containerRef } = useContainerHeight();

  if (store.isLoading) {
    return <LoadingChart containerHeight={containerHeight} />;
  }

  if (store.isError) {
    return <ErrorMessage />;
  }

  const chartData = pipe(groupByMonth(["total_revocations"]), (dataset) =>
    sortFilterAndSupplementMostRecentMonths(
      dataset,
      toNumber(get(filters, METRIC_PERIOD_MONTHS)),
      "total_revocations",
      0,
    ),
  )(store.filteredData);

  const labels = monthNamesAllWithYearsFromNumbers(
    map("month", chartData),
    false,
  );
  const dataPoints = map("total_revocations", chartData);

  centerSingleMonthDatasetIfNecessary(dataPoints, labels);

  const chartLabels = labels;
  const chartDataPoints = dataPoints;

  const datasets = [
    {
      label: translate("Revocations"),
      borderColor: COLORS["lantern-light-blue"],
      pointBackgroundColor: COLORS["lantern-light-blue"],
      fill: false,
      lineTension: 0,
      borderWidth: 2,
      data: chartDataPoints,
      backgroundColor: COLORS["lantern-light-blue"],
      hoverBackgroundColor: COLORS["lantern-light-blue"],
      hoverBorderColor: COLORS["lantern-light-blue"],
      barPercentage: 0.08,
      barThickness: "flex",
    },
    generateTrendlineDataset(chartDataPoints, COLORS["lantern-soft-blue"]),
  ];
  const maxElement = Math.max(...chartDataPoints);
  const maxValue = maxElement <= 7 ? 7 : maxElement;

  const options = {
    plugins: {
      datalabels: {
        display: false,
      },
    },
    maintainAspectRatio: false,
    responsive: true,
    legend: {
      display: false,
    },
    scales: {
      xAxes: [
        {
          ticks: {
            autoSkip: false,
          },
        },
      ],
      yAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: `Number of ${translate("revocations")}`,
          },
          ticks: {
            min: 0,
            suggestedMax: maxValue,
          },
        },
      ],
    },
    tooltips: {
      backgroundColor: COLORS["grey-800-light"],
      mode: "x",
    },
    annotation: currentMonthBox(
      "currentMonthBoxRevocationsOverTime",
      chartLabels,
    ),
  };

  const countZero = chartDataPoints.filter((item) => item === 0).length;

  const lineChart = (
    <Line
      id={CHART_ID}
      data={{
        labels: chartLabels,
        datasets,
      }}
      options={options}
    />
  );

  const barChart = (
    <Bar
      id={CHART_ID}
      width={50}
      data={{
        labels: chartLabels,
        datasets,
      }}
      options={options}
    />
  );

  // If at least a third of all points are 0, show bar chart. Otherwise, show line chart.
  const chart =
    countZero / get(filters, METRIC_PERIOD_MONTHS) >= 0.33
      ? barChart
      : lineChart;

  return (
    <div ref={containerRef}>
      <RevocationsByDimensionComponent
        chartTitle={CHART_TITLE}
        timeDescription={timeDescription}
        labels={chartLabels}
        chartId={CHART_ID}
        datasets={datasets}
        metricTitle={translate("revocationsOverTimeChartTitle")}
        chart={chart}
        classModifier={CHART_ID}
        dataExportLabel="Month"
      />
    </div>
  );
}

RevocationsOverTime.propTypes = {
  timeDescription: PropTypes.string.isRequired,
};

export default observer(RevocationsOverTime);
