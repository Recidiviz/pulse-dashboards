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

import PropTypes from "prop-types";
import React from "react";
import { Bar } from "react-chartjs-2";

import { COLORS } from "../assets/scripts/constants/colors";
import { axisCallbackForPercentage } from "./utils/axis";
import { getRateAnnotation } from "./utils/rate";
import { tooltipForFooterWithCounts } from "./utils/significantStatistics";
import { tooltipForRateMetricWithCounts } from "./utils/tooltips";

function PercentRevokedChart({
  chartId,
  data,
  averageRate,
  numerators,
  denominators,
  xAxisLabel,
  yAxisLabel,
  includeWarning,
  hideRateLine,
}) {
  return (
    <Bar
      id={chartId}
      data={data}
      options={{
        plugins: {
          datalabels: {
            display: false,
          },
        },
        annotation: !hideRateLine && getRateAnnotation(averageRate),
        legend: {
          display: false,
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          xAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: xAxisLabel,
              },
              stacked: true,
            },
          ],
          yAxes: [
            {
              id: "y-axis-0",
              scaleLabel: {
                display: true,
                labelString: yAxisLabel,
              },
              stacked: true,
              ticks: {
                callback: axisCallbackForPercentage(),
                precision: 0,
              },
            },
          ],
        },
        tooltips: {
          backgroundColor: COLORS["grey-800-light"],
          footerFontSize: 9,
          mode: "index",
          intersect: false,
          callbacks: {
            label: (tooltipItem, tooltipData) =>
              tooltipForRateMetricWithCounts(
                chartId,
                tooltipItem,
                tooltipData,
                numerators,
                denominators,
                includeWarning,
              ),
            footer: (tooltipItem) =>
              includeWarning &&
              tooltipForFooterWithCounts(tooltipItem, denominators),
          },
        },
      }}
    />
  );
}

PercentRevokedChart.propTypes = {
  chartId: PropTypes.string.isRequired,
  data: PropTypes.shape({
    labels: PropTypes.arrayOf(PropTypes.string),
    datasets: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        backgroundColor: PropTypes.func,
        data: PropTypes.arrayOf(PropTypes.string),
      }),
    ),
  }).isRequired,
  numerators: PropTypes.arrayOf(PropTypes.number).isRequired,
  denominators: PropTypes.arrayOf(PropTypes.number).isRequired,
  xAxisLabel: PropTypes.string.isRequired,
  yAxisLabel: PropTypes.string.isRequired,
  averageRate: PropTypes.number.isRequired,
  includeWarning: PropTypes.bool,
  hideRateLine: PropTypes.bool,
};

PercentRevokedChart.defaultProps = {
  includeWarning: true,
  hideRateLine: false,
};

export default PercentRevokedChart;
