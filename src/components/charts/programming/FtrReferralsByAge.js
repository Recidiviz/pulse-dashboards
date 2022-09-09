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
import { Bar } from "react-chartjs-2";

import pipe from "lodash/fp/pipe";

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
import { toInt } from "../../../utils/transforms/labels";

const chartId = "ftrReferralsByAge";
const ageBucketLabels = ["<25", "25-29", "30-34", "35-39", "40<"];
const ageBucketDisplayLabels = [
  "Under 25",
  "25-29",
  "30-34",
  "35-39",
  "40 and over",
];

const FtrReferralsByAge = ({
  ftrReferralsByAge,
  supervisionType,
  district,
  metricPeriodMonths,
  metricType,
}) => {
  const filteredFtrReferrals = pipe(
    (dataset) => filterDatasetBySupervisionType(dataset, supervisionType),
    (dataset) => filterDatasetByDistrict(dataset, district),
    (dataset) => filterDatasetByMetricPeriodMonths(dataset, metricPeriodMonths)
  )(ftrReferralsByAge);

  let totalFtrReferrals = 0;
  let totalSupervisionPopulation = 0;
  const ftrReferralDataPoints = {};
  const supervisionDataPoints = {};

  if (filteredFtrReferrals) {
    filteredFtrReferrals.forEach((data) => {
      let { age_bucket: age } = data;

      if (age === "0-24") {
        age = "Under 25";
      } else if (age === "40+") {
        age = "40 and over";
      }

      const referralCount = toInt(data.count, 10);

      if (!ftrReferralDataPoints[age]) {
        ftrReferralDataPoints[age] = 0;
      }
      ftrReferralDataPoints[age] += referralCount;
      totalFtrReferrals += referralCount;

      const totalSupervisionCount = toInt(data.total_supervision_count);

      if (!supervisionDataPoints[age]) {
        supervisionDataPoints[age] = 0;
      }
      supervisionDataPoints[age] += totalSupervisionCount;
      totalSupervisionPopulation += totalSupervisionCount;
    });
  }

  const referralsByAgeCounts = [];
  const referralsByAgeProportions = [];
  const supervisionByAgeCounts = [];
  const supervisionByAgeProportions = [];

  for (let i = 0; i < ageBucketLabels.length; i += 1) {
    const referralValue = ftrReferralDataPoints[ageBucketLabels[i]];
    if (!referralValue || !totalFtrReferrals) {
      referralsByAgeCounts.push(0);
      referralsByAgeProportions.push(0);
    } else {
      referralsByAgeCounts.push(referralValue);
      referralsByAgeProportions.push(100 * (referralValue / totalFtrReferrals));
    }

    const supervisionValue = supervisionDataPoints[ageBucketLabels[i]];
    if (!supervisionValue || !totalSupervisionPopulation) {
      supervisionByAgeCounts.push(0);
      supervisionByAgeProportions.push(0);
    } else {
      supervisionByAgeCounts.push(supervisionValue);
      supervisionByAgeProportions.push(
        100 * (supervisionValue / totalSupervisionPopulation)
      );
    }
  }

  const chartLabels = ageBucketDisplayLabels;
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
                labelString: "Age",
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
          {
            label: chartLabels[4],
            backgroundColor: COLORS_FIVE_VALUES[4],
            hoverBackgroundColor: COLORS_FIVE_VALUES[4],
            hoverBorderColor: COLORS_FIVE_VALUES[4],
            yAxisID: "y-axis-left",
            data: [ftrReferralProportions[4], stateSupervisionProportions[4]],
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
                labelString: "Age",
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
    metric: "FTR Referrals by Age",
    series: [],
  });

  useEffect(() => {
    configureDownloadButtons(
      chartId,
      "FTR REFERRALS BY AGE",
      activeChart.props.data.datasets,
      activeChart.props.data.labels,
      document.getElementById(chartId),
      exportedStructureCallback,
      { supervisionType, district, metricPeriodMonths, metricType }
    );
  }, [
    supervisionType,
    district,
    metricPeriodMonths,
    metricType,
    activeChart.props.data.datasets,
    activeChart.props.data.labels,
  ]);

  return activeChart;
};

export default FtrReferralsByAge;
