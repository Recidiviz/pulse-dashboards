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

import React from "react";
import PropTypes from "prop-types";
import { Bar, Pie } from "react-chartjs-2";

import concat from "lodash/fp/concat";
import defaults from "lodash/fp/defaults";
import entries from "lodash/fp/entries";
import map from "lodash/fp/map";
import merge from "lodash/fp/merge";
import mergeAllWith from "lodash/fp/mergeAllWith";
import pipe from "lodash/fp/pipe";
import reduce from "lodash/fp/reduce";
import toInteger from "lodash/fp/toInteger";

import {
  COLORS,
  COLORS_FIVE_VALUES,
} from "../../../assets/scripts/constants/colors";
import { configureDownloadButtons } from "../../../assets/scripts/utils/downloads";
import {
  filterDatasetByDistrict,
  filterDatasetBySupervisionType,
  filterDatasetByMetricPeriodMonths,
} from "../../../utils/charts/toggles";
import { sortByLabel } from "../../../utils/transforms/datasets";

const chartId = "admissionCountsByType";

const UNKNOWN_REVOCATION = "Revocations (Unknown Type)";
const NEW_ADMISSION = "New Admissions";
const NON_TECHNICAL = "Non-Technical Revocations";
const TECHNICAL = "Technical Revocations";

const AdmissionCountsByType = ({
  admissionCountsByType,
  metricPeriodMonths,
  metricType,
  district,
  supervisionType,
}) => {
  // This chart does not support district or supervision type breakdowns for rates, only counts
  const filterDistrict = metricType === "counts" ? district : ["all"];
  const filterSupervisionType =
    metricType === "counts" ? supervisionType : "all";

  const filteredAdmissionCounts = pipe(
    (dataset) => filterDatasetByDistrict(dataset, filterDistrict),
    (dataset) => filterDatasetBySupervisionType(dataset, filterSupervisionType),
    (dataset) => filterDatasetByMetricPeriodMonths(dataset, metricPeriodMonths),
    map((data) => ({
      [TECHNICAL]: toInteger(data.technicals),
      [NON_TECHNICAL]: toInteger(data.non_technicals),
      [UNKNOWN_REVOCATION]: toInteger(data.unknown_revocations),
    })),
    mergeAllWith((obj, src) => obj + src)
  )(admissionCountsByType);

  // For this chart specifically, we want the new admissions total to always be equal to the
  // new admissions admission count where supervision type and district both equal ALL
  const dataPoints = pipe(
    (dataset) => filterDatasetBySupervisionType(dataset, "ALL"),
    (dataset) => filterDatasetByDistrict(dataset, ["ALL"]),
    (dataset) => filterDatasetByMetricPeriodMonths(dataset, metricPeriodMonths),
    ([data]) => ({
      [NEW_ADMISSION]: toInteger(data.new_admissions),
    }),
    (dataset) => merge(filteredAdmissionCounts, dataset),
    defaults({
      [UNKNOWN_REVOCATION]: 0,
      [NEW_ADMISSION]: 0,
      [NON_TECHNICAL]: 0,
      [TECHNICAL]: 0,
    }),
    entries,
    reduce(
      (acc, [key, value]) => concat([{ type: key, count: value }], acc),
      []
    ),
    (dataset) => sortByLabel(dataset, "type")
  )(admissionCountsByType);

  const chartLabels = map("type", dataPoints);
  const chartDataPoints = map("count", dataPoints);

  const chartColors = [
    COLORS_FIVE_VALUES[1],
    COLORS_FIVE_VALUES[0],
    COLORS_FIVE_VALUES[3],
    COLORS_FIVE_VALUES[2],
  ];

  const ratesChart = (
    <Pie
      id={chartId}
      data={{
        datasets: [
          {
            label: "Admission count",
            data: chartDataPoints,
            // Note: these colors are intentionally set in this order so that
            // the colors for technical and unknown revocations match those of
            // the other charts on this page
            backgroundColor: chartColors,
            hoverBackgroundColor: chartColors,
            hoverBorderColor: chartColors,
            hoverBorderWidth: 0.5,
          },
        ],
        labels: chartLabels,
      }}
      options={{
        responsive: true,
        legend: {
          position: "right",
        },
        tooltips: {
          backgroundColor: COLORS["grey-800-light"],
          callbacks: {
            label: (tooltipItem, data) => {
              const dataset = data.datasets[tooltipItem.datasetIndex];

              const total = dataset.data.reduce(
                (previousValue, currentValue) => previousValue + currentValue
              );

              const currentValue = dataset.data[tooltipItem.index];
              const percentage = ((currentValue / total) * 100).toFixed(2);

              return data.labels[tooltipItem.index].concat(
                ": ",
                percentage,
                "% (",
                currentValue,
                ")"
              );
            },
          },
        },
      }}
    />
  );

  const countsChart = (
    <Bar
      id={chartId}
      data={{
        labels: ["Admission Counts"],
        datasets: [
          {
            label: chartLabels[0],
            backgroundColor: chartColors[0],
            hoverBackgroundColor: chartColors[0],
            hoverBorderColor: chartColors[0],
            data: [chartDataPoints[0]],
          },
          {
            label: chartLabels[1],
            backgroundColor: chartColors[1],
            hoverBackgroundColor: chartColors[1],
            hoverBorderColor: chartColors[1],
            data: [chartDataPoints[1]],
          },
          {
            label: chartLabels[2],
            backgroundColor: chartColors[2],
            hoverBackgroundColor: chartColors[2],
            hoverBorderColor: chartColors[2],
            data: [chartDataPoints[2]],
          },
          {
            label: chartLabels[3],
            backgroundColor: chartColors[3],
            hoverBackgroundColor: chartColors[3],
            hoverBorderColor: chartColors[3],
            data: [chartDataPoints[3]],
          },
        ],
      }}
      options={{
        responsive: true,
        legend: {
          position: "right",
        },
        tooltips: {
          mode: "index",
          intersect: false,
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
                labelString: "Admission counts",
              },
              ticks: {
                min: 0,
              },
            },
          ],
        },
      }}
    />
  );

  const activeChart = metricType === "rates" ? ratesChart : countsChart;

  const exportedStructureCallback = () => ({
    metric: "Admissions by type",
    series: [],
  });

  configureDownloadButtons(
    chartId,
    "ADMISSIONS BY TYPE",
    activeChart.props.data.datasets,
    activeChart.props.data.labels,
    document.getElementById(chartId),
    exportedStructureCallback,
    { metricPeriodMonths, metricType, district, supervisionType }
  );

  return activeChart;
};

AdmissionCountsByType.propTypes = {
  admissionCountsByType: PropTypes.arrayOf(PropTypes.shape({})),
  supervisionType: PropTypes.string.isRequired,
  district: PropTypes.arrayOf(PropTypes.string).isRequired,
  metricType: PropTypes.string.isRequired,
  metricPeriodMonths: PropTypes.string.isRequired,
};

export default AdmissionCountsByType;
