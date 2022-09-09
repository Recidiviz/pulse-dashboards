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

import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Line } from "react-chartjs-2";

import groupBy from "lodash/fp/groupBy";
import map from "lodash/fp/map";
import pipe from "lodash/fp/pipe";
import meanBy from "lodash/fp/meanBy";
import toInteger from "lodash/fp/toInteger";
import values from "lodash/fp/values";

import { COLORS } from "../../../assets/scripts/constants/colors";
import { configureDownloadButtons } from "../../../utils/downloads/downloads";
import {
  getGoalForChart,
  getMinForGoalAndData,
  getMaxForGoalAndData,
  trendlineGoalText,
  chartAnnotationForGoal,
} from "../../../utils/charts/metricGoal";
import {
  filterDatasetBySupervisionType,
  filterDatasetByDistrict,
} from "../../../utils/charts/dataFilters";
import {
  getMonthCountFromMetricPeriodMonthsToggle,
  canDisplayGoal,
  centerSingleMonthDatasetIfNecessary,
} from "../../../utils/charts/toggles";
import {
  generateTrendlineDataset,
  getTooltipWithoutTrendline,
} from "../../../utils/charts/trendline";
import { sortFilterAndSupplementMostRecentMonths } from "../../../utils/transforms/datasets";
import { monthNamesWithYearsFromNumbers } from "../../../utils/transforms/months";

const groupByMonthAndMap = pipe(
  groupBy(
    ({ termination_year: year, termination_month: month }) => `${year}-${month}`
  ),
  values,
  map((dataset) => ({
    year: toInteger(dataset[0].termination_year),
    month: toInteger(dataset[0].termination_month),
    change: meanBy(
      (data) => parseFloat(data.average_change, 10),
      dataset
    ).toFixed(2),
  }))
);

const chartId = "lsirScoreChangeSnapshot";
const stepSize = 0.5;

const LsirScoreChangeSnapshot = ({
  lsirScoreChangeByMonth: changeByMonth,
  supervisionType,
  district,
  metricPeriodMonths,
  disableGoal,
  header = null,
}) => {
  const goal = getGoalForChart("US_ND", chartId);
  const displayGoal = canDisplayGoal(goal, {
    supervisionType,
    district,
    disableGoal,
  });

  const dataPoints = pipe(
    (dataset) => filterDatasetBySupervisionType(dataset, supervisionType),
    (dataset) => filterDatasetByDistrict(dataset, district),
    groupByMonthAndMap,
    (dataset) =>
      sortFilterAndSupplementMostRecentMonths(
        dataset,
        getMonthCountFromMetricPeriodMonthsToggle(metricPeriodMonths),
        "change",
        "0.0"
      )
  )(changeByMonth);

  const chartDataValues = map("change", dataPoints);
  const min = getMinForGoalAndData(goal.value, chartDataValues, stepSize);
  const max = getMaxForGoalAndData(goal.value, chartDataValues, stepSize);
  const monthNames = monthNamesWithYearsFromNumbers(
    map("month", dataPoints),
    true
  );

  centerSingleMonthDatasetIfNecessary(chartDataValues, monthNames);

  const chartLabels = monthNames;
  const chartDataPoints = chartDataValues;
  const chartMinValue = min;
  const chartMaxValue = max;

  function goalLineIfApplicable() {
    if (displayGoal) {
      return chartAnnotationForGoal(goal, "lsirScoreChangeSnapshotGoalLine", {
        yAdjust: 10,
      });
    }
    return null;
  }

  function datasetsWithTrendlineIfApplicable() {
    const datasets = [
      {
        label: "LSI-R score changes (average)",
        backgroundColor: COLORS["blue-standard"],
        borderColor: COLORS["blue-standard"],
        pointBackgroundColor: COLORS["blue-standard"],
        pointHoverBackgroundColor: COLORS["blue-standard"],
        pointHoverBorderColor: COLORS["blue-standard"],
        pointRadius: 4,
        hitRadius: 5,
        fill: false,
        borderWidth: 2,
        lineTension: 0,
        data: chartDataPoints,
      },
    ];
    if (displayGoal) {
      datasets.push(
        generateTrendlineDataset(chartDataPoints, COLORS["blue-standard-light"])
      );
    }
    return datasets;
  }

  const chart = (
    <Line
      id={chartId}
      data={{
        labels: chartLabels,
        datasets: datasetsWithTrendlineIfApplicable(),
      }}
      options={{
        legend: {
          display: false,
          position: "right",
          labels: {
            usePointStyle: true,
            boxWidth: 5,
          },
        },
        tooltips: {
          backgroundColor: COLORS["grey-800-light"],
          enabled: true,
          mode: "point",
          callbacks: {
            label: (tooltipItem, data) =>
              getTooltipWithoutTrendline(tooltipItem, data),
          },
        },
        scales: {
          xAxes: [
            {
              ticks: {
                fontColor: COLORS["grey-600"],
                autoSkip: true,
              },
              scaleLabel: {
                display: true,
                labelString: "Month of supervision termination",
                fontColor: COLORS["grey-500"],
                fontStyle: "bold",
              },
              gridLines: {
                color: "#FFF",
              },
            },
          ],
          yAxes: [
            {
              ticks: {
                fontColor: COLORS["grey-600"],
                min: chartMinValue,
                max: chartMaxValue,
                stepSize,
              },
              scaleLabel: {
                display: true,
                labelString: "Change in LSI-R scores",
                fontColor: COLORS["grey-500"],
                fontStyle: "bold",
              },
              gridLines: {
                color: COLORS["grey-300"],
              },
            },
          ],
        },
        annotation: goalLineIfApplicable(),
      }}
    />
  );

  useEffect(() => {
    configureDownloadButtons({
      chartId,
      chartTitle: "LSI-R SCORE CHANGES (AVERAGE)",
      chartDatasets: chart.props.data.datasets,
      chartLabels: chart.props.data.labels,
      chartBox: document.getElementById(chartId),
      filters: { supervisionType, district, metricPeriodMonths },
      convertValuesToNumbers: true,
      handleTimeStringLabels: true,
    });
  }, [
    metricPeriodMonths,
    district,
    supervisionType,
    chart.props.data.datasets,
    chart.props.data.labels,
  ]);

  useEffect(() => {
    const headerElement = header && document.getElementById(header);

    if (headerElement && displayGoal) {
      const trendlineValues = chart.props.data.datasets[1].data;
      const trendlineText = trendlineGoalText(trendlineValues, goal);

      const title = `The average change in LSI-R scores between first reassessment and termination of supervision has been <span class='fs-block header-highlight'>trending ${trendlineText}.</span>`;
      headerElement.innerHTML = title;
    } else if (headerElement) {
      headerElement.innerHTML = "";
    }
  }, [chart.props.data.datasets, displayGoal, goal, header]);

  return chart;
};

LsirScoreChangeSnapshot.defaultProps = {
  header: null,
  disableGoal: false,
};

LsirScoreChangeSnapshot.propTypes = {
  lsirScoreChangeByMonth: PropTypes.arrayOf(
    PropTypes.shape({
      average_change: PropTypes.string,
      district: PropTypes.string,
      state_code: PropTypes.string,
      supervision_type: PropTypes.string,
      termination_month: PropTypes.string,
      termination_year: PropTypes.string,
    })
  ).isRequired,
  metricPeriodMonths: PropTypes.string.isRequired,
  supervisionType: PropTypes.string.isRequired,
  district: PropTypes.arrayOf(PropTypes.string).isRequired,
  header: PropTypes.string,
  disableGoal: PropTypes.bool,
};

export default LsirScoreChangeSnapshot;
