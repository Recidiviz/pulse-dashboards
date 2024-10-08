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

import "chartjs-plugin-datalabels";

import PropTypes from "prop-types";
import React from "react";
import { Bar } from "react-chartjs-2";

import { COLORS } from "../../assets/scripts/constants/colors";
import { axisCallbackForPercentage } from "../utils/axis";
import { tooltipForFooterWithCounts } from "../utils/significantStatistics";
import { tooltipForRateMetricWithCounts } from "../utils/tooltips";
import { generateLabelsWithCustomColors } from "./helpers";

const getDefaultLegendOptions = (labelColors) => {
  return labelColors.length
    ? {
        position: "bottom",
        labels: {
          generateLabels: (ch) =>
            generateLabelsWithCustomColors(ch, labelColors),
        },
      }
    : { display: false };
};

function BarChartWithLabels({
  id,
  data,
  labelColors,
  xAxisLabel,
  yAxisLabel,
  numerators,
  denominators,
  legendOptions,
}) {
  return (
    <Bar
      id={id}
      data={data}
      options={{
        plugins: {
          datalabels: {
            display: false,
          },
        },
        legend: legendOptions || getDefaultLegendOptions(labelColors),
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          xAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: xAxisLabel,
              },
            },
          ],
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
                callback: axisCallbackForPercentage(),
              },
              scaleLabel: {
                display: true,
                labelString: yAxisLabel,
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
                id,
                tooltipItem,
                tooltipData,
                numerators,
                denominators,
              ),
            footer: (tooltipItem) =>
              tooltipForFooterWithCounts(tooltipItem, denominators),
          },
        },
      }}
    />
  );
}

BarChartWithLabels.defaultProps = {
  labelColors: [],
  legendOptions: null,
};

BarChartWithLabels.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.shape({
    labels: PropTypes.arrayOf(PropTypes.string),
    datasets: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        backgroundColor: PropTypes.oneOfType([
          PropTypes.func,
          PropTypes.arrayOf(PropTypes.string),
          PropTypes.string,
        ]),
        data: PropTypes.arrayOf(PropTypes.string),
      }),
    ),
  }).isRequired,
  xAxisLabel: PropTypes.string.isRequired,
  yAxisLabel: PropTypes.string.isRequired,
  numerators: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.number),
      PropTypes.number,
    ]),
  ).isRequired,
  denominators: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.number),
      PropTypes.number,
    ]),
  ).isRequired,
  labelColors: PropTypes.arrayOf(PropTypes.string),
  legendOptions: PropTypes.shape({
    position: PropTypes.string,
    align: PropTypes.string,
    rtl: PropTypes.bool,
    reverse: PropTypes.bool,
    labels: PropTypes.shape({
      usePointStyle: PropTypes.bool,
      boxWidth: PropTypes.number,
      generateLabels: PropTypes.func,
    }),
  }),
};
export default BarChartWithLabels;
