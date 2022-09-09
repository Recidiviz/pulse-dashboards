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

import React from "react";
import { Bar } from "react-chartjs-2";

import defaults from "lodash/fp/defaults";
import groupBy from "lodash/fp/groupBy";
import map from "lodash/fp/map";
import pipe from "lodash/fp/pipe";
import sumBy from "lodash/fp/sumBy";
import reduce from "lodash/fp/reduce";
import toInteger from "lodash/fp/toInteger";
import values from "lodash/fp/values";

import {
  COLORS,
  COLORS_FIVE_VALUES,
} from "../../../assets/scripts/constants/colors";
import { configureDownloadButtons } from "../../../assets/scripts/utils/downloads";
import {
  filterDatasetBySupervisionType,
  filterDatasetByDistrict,
  filterDatasetByMetricPeriodMonths,
} from "../../../utils/charts/toggles";
import {
  tooltipForCountChart,
  tooltipForRateChart,
} from "../../../utils/charts/tooltips";

const chartId = "ftrReferralsByLsir";

const lsirScoreBuckets = ["0-23", "24-29", "30-38", "39+"];
const lsirDefaults = reduce(
  (acc, lsir) => ({
    ...acc,
    [lsir]: {
      referralCount: 0,
      supervisionCount: 0,
    },
  }),
  {},
  lsirScoreBuckets
);

const calculateTotal = (field) => pipe(values, sumBy(field));

const FtrReferralsByLsir = ({
  ftrReferralsByLsir,
  supervisionType,
  district,
  metricPeriodMonths,
  metricType,
}) => {
  const filteredFtrReferrals = pipe(
    (dataset) => filterDatasetBySupervisionType(dataset, supervisionType),
    (dataset) => filterDatasetByDistrict(dataset, district),
    (dataset) => filterDatasetByMetricPeriodMonths(dataset, metricPeriodMonths),
    groupBy("assessment_score_bucket"),
    values,
    reduce(
      (acc, dataset) => ({
        ...acc,
        [dataset[0].assessment_score_bucket]: {
          referralCount: sumBy(({ count }) => toInteger(count), dataset),
          supervisionCount: sumBy(
            ({ total_supervision_count: supervisionCount }) =>
              toInteger(supervisionCount),
            dataset
          ),
        },
      }),
      {}
    ),
    defaults(lsirDefaults)
  )(ftrReferralsByLsir);

  // totals
  const totalFtrReferrals = calculateTotal("referralCount")(
    filteredFtrReferrals
  );
  const totalSupervisionPopulation = calculateTotal("supervisionCount")(
    filteredFtrReferrals
  );

  // referrals
  const referralsByAgeCounts = map(
    (lsir) => filteredFtrReferrals[lsir].referralCount,
    lsirScoreBuckets
  );
  const referralsByAgeProportions = map(
    (lsir) =>
      (100 * filteredFtrReferrals[lsir].referralCount) / totalFtrReferrals,
    lsirScoreBuckets
  );

  // supervision
  const supervisionByAgeCounts = map(
    (lsir) => filteredFtrReferrals[lsir].supervisionCount,
    lsirScoreBuckets
  );
  const supervisionByAgeProportions = map(
    (lsir) =>
      (100 * filteredFtrReferrals[lsir].supervisionCount) /
      totalSupervisionPopulation,
    lsirScoreBuckets
  );

  const chartLabels = lsirScoreBuckets;
  const ftrReferralCounts = referralsByAgeCounts;
  const ftrReferralProportions = referralsByAgeProportions;
  const stateSupervisionCounts = supervisionByAgeCounts;
  const stateSupervisionProportions = supervisionByAgeProportions;

  const countsChart = (
    <Bar
      id={chartId}
      data={{
        labels: chartLabels,
        datasets: [
          {
            label: "Referrals",
            backgroundColor: COLORS["blue-standard"],
            hoverBackgroundColor: COLORS["blue-standard"],
            yAxisID: "y-axis-left",
            data: ftrReferralCounts,
          },
          {
            label: "Supervision Population",
            backgroundColor: COLORS["blue-standard-2"],
            hoverBackgroundColor: COLORS["blue-standard-2"],
            yAxisID: "y-axis-left",
            data: stateSupervisionCounts,
          },
        ],
      }}
      options={{
        responsive: true,
        legend: {
          display: true,
          position: "bottom",
        },
        tooltips: {
          backgroundColor: COLORS["grey-800-light"],
          mode: "index",
          callbacks: tooltipForCountChart(
            ftrReferralCounts,
            "Referral",
            stateSupervisionCounts,
            "Supervision"
          ),
        },
        scaleShowValues: true,
        scales: {
          yAxes: [
            {
              stacked: false,
              ticks: {
                beginAtZero: true,
                min: undefined,
                max: undefined,
              },
              position: "left",
              id: "y-axis-left",
              scaleLabel: {
                display: true,
                labelString: "Count",
              },
            },
          ],
          xAxes: [
            {
              stacked: false,
              ticks: {
                autoSkip: false,
              },
              scaleLabel: {
                display: true,
                labelString: "LSI-R Score",
              },
            },
          ],
        },
      }}
    />
  );

  const ratesChart = (
    <Bar
      id={chartId}
      data={{
        labels: ["Referrals", "Supervision Population"],
        datasets: [
          {
            label: chartLabels[0],
            backgroundColor: COLORS_FIVE_VALUES[0],
            hoverBackgroundColor: COLORS_FIVE_VALUES[0],
            hoverBorderColor: COLORS_FIVE_VALUES[0],
            yAxisID: "y-axis-left",
            data: [ftrReferralProportions[0], stateSupervisionProportions[0]],
          },
          {
            label: chartLabels[1],
            backgroundColor: COLORS_FIVE_VALUES[1],
            hoverBackgroundColor: COLORS_FIVE_VALUES[1],
            hoverBorderColor: COLORS_FIVE_VALUES[1],
            yAxisID: "y-axis-left",
            data: [ftrReferralProportions[1], stateSupervisionProportions[1]],
          },
          {
            label: chartLabels[2],
            backgroundColor: COLORS_FIVE_VALUES[2],
            hoverBackgroundColor: COLORS_FIVE_VALUES[2],
            hoverBorderColor: COLORS_FIVE_VALUES[2],
            yAxisID: "y-axis-left",
            data: [ftrReferralProportions[2], stateSupervisionProportions[2]],
          },
          {
            label: chartLabels[3],
            backgroundColor: COLORS_FIVE_VALUES[3],
            hoverBackgroundColor: COLORS_FIVE_VALUES[3],
            hoverBorderColor: COLORS_FIVE_VALUES[3],
            yAxisID: "y-axis-left",
            data: [ftrReferralProportions[3], stateSupervisionProportions[3]],
          },
        ],
      }}
      options={{
        responsive: true,
        legend: {
          display: true,
          position: "bottom",
        },
        tooltips: {
          backgroundColor: COLORS["grey-800-light"],
          mode: "dataset",
          intersect: true,
          callbacks: tooltipForRateChart(),
        },
        scaleShowValues: true,
        scales: {
          yAxes: [
            {
              stacked: true,
              ticks: {
                beginAtZero: true,
                min: 0,
                max: 100,
              },
              position: "left",
              id: "y-axis-left",
              scaleLabel: {
                display: true,
                labelString: "Percentage",
              },
            },
          ],
          xAxes: [
            {
              stacked: true,
              ticks: {
                autoSkip: false,
              },
              scaleLabel: {
                display: true,
                labelString: "LSI-R Score",
              },
            },
          ],
        },
      }}
    />
  );

  let activeChart = countsChart;
  if (metricType === "rates") {
    activeChart = ratesChart;
  }

  const exportedStructureCallback = () => ({
    metric: "FTR Referrals by LSI-R Scores",
    series: [],
  });

  configureDownloadButtons(
    chartId,
    "FTR REFERRALS BY LSI-R",
    activeChart.props.data.datasets,
    activeChart.props.data.labels,
    document.getElementById(chartId),
    exportedStructureCallback,
    { supervisionType, district, metricPeriodMonths, metricType }
  );

  return activeChart;
};

export default FtrReferralsByLsir;
